#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "librtmp/rtmp.h"   
#include "librtmp/rtmp_sys.h"   
#include "librtmp/amf.h"
#include "librtmp/log.h"
#include "sps_decode.h"
#include "send_av.h"

#define RTMP_HEAD_SIZE (sizeof(RTMPPacket) + RTMP_MAX_HEADER_SIZE)
#define BUFFER_SIZE 2*1024*1024
#define FLV_TAG_HEAD_LEN 11
#define FLV_PRE_TAG_LEN 4
#define AAC_ADTS_HEADER_SIZE 7

static uint8_t start_code3[] = {0x00, 0x00, 0x01};
static uint8_t start_code4[] = {0x00, 0x00, 0x00, 0x01};

static const AVal av_onMetaData = AVC("onMetaData");
static const AVal av_duration = AVC("duration");
static const AVal av_width = AVC("width");
static const AVal av_height = AVC("height");
static const AVal av_videoframerate = AVC("videoframerate");
static const AVal av_videocodecid = AVC("videocodecid");
static const AVal av_audiodatarate = AVC("audiodatarate");
static const AVal av_audiosamplerate = AVC("audiosamplerate");
static const AVal av_audiosamplesize = AVC("audiosamplesize");
static const AVal av_stereo = AVC("stereo");
static const AVal av_audiocodecid = AVC("audiocodecid");

static sps_pps_t g_video_meta = {0};
FILE *dump_flv = NULL;

typedef struct _NaluUnit
{
	int type;
	int size;
	unsigned char data[BUFFER_SIZE];
}NaluUnit;

typedef struct _QueueNode
{
	int size;
	char buffer[BUFFER_SIZE];
}QueueNode;

static int SendFlvHeader(RTMPConnect *conn, sps_pps_t *s, uint32_t time_stamp);
static int SendFlvAudioHeader(RTMPConnect *conn, uint32_t time_stamp);
static int SendFlvSpsPps(RTMPConnect *conn, unsigned char *pps, int pps_len, unsigned char * sps, int sps_len, uint32_t time_stamp);
static void free_queue_node(gpointer node);

static int64_t get_current_ms()
{
	struct timespec tm;
	if(clock_gettime(CLOCK_MONOTONIC, &tm) < 0)
		return -1;

	return (int64_t)tm.tv_sec*1000 + (int64_t)tm.tv_nsec/1000000;
}

static unsigned char* find_h264_startcode(unsigned char *buf_begin, unsigned char *buf_end, int *startcode_len)
{
	unsigned char *pb=buf_begin, *pe=buf_end;

	while(pb < pe - 4)
	{
		if(memcmp(pb, start_code3, sizeof(start_code3)) == 0)
		{
			*startcode_len = sizeof(start_code3);
			return pb+sizeof(start_code3);
		}
		else if(memcmp(pb, start_code4, sizeof(start_code4)) == 0)
		{
			*startcode_len = sizeof(start_code4);
			return pb+sizeof(start_code4);
		}
		else
		{
			pb++;
		}
	}

	*startcode_len = 0;
	return NULL;
}

static unsigned char * getOneNaluFromBuf(unsigned char *buffer_begin, unsigned char *buffer_end, NaluUnit *nalu)
{
	int startcodelen;
	unsigned char *next = find_h264_startcode(buffer_begin, buffer_end, &startcodelen);
	if(next)
	{
		nalu->size = next - startcodelen - buffer_begin;
		memcpy(nalu->data, buffer_begin, nalu->size);
		nalu->type = nalu->data[0] & 0x1f;
		return next;
	}
	else
	{
		nalu->size = buffer_end - buffer_begin;
		memcpy(nalu->data, buffer_begin, nalu->size);
		nalu->type = nalu->data[0] & 0x1f;
		return buffer_end;
	}

	return NULL;
}

static int _rtmp_client_reconnect(RTMPConnect *conn)
{
	/* destroy old connection */
	if(conn->rtmp_handle)
	{
		RTMP_Close(conn->rtmp_handle);
		RTMP_Free(conn->rtmp_handle);
		conn->rtmp_handle = NULL;
	}

	/* create new connection */
	conn->rtmp_handle = RTMP_Alloc();
	if(conn->rtmp_handle == NULL)
		return -1;
	
	RTMP_Init(conn->rtmp_handle);
	
	if(rtmp_client_connect(conn, conn->url) < 0)
	{
		RTMP_Close(conn->rtmp_handle);
		RTMP_Free(conn->rtmp_handle);
		conn->rtmp_handle = NULL;
		return -1;
	}

	return 0;
}

static void* sendFrameThread(void *arg)
{
	RTMPConnect *conn = (RTMPConnect *)arg;

	while(conn->abort_send == 0)
	{
		g_mutex_lock(&conn->send_mutex);
		if(g_queue_is_empty(conn->frame_flow) == FALSE)
		{
			QueueNode *node = (QueueNode *)g_queue_pop_head(conn->frame_flow);
			if(conn->rtmp_handle)
			{
				if(RTMP_Write(conn->rtmp_handle, node->buffer, node->size) < 0)
				{
					printf("%s:%d reconnect peer at %ld\n", __FILE__, __LINE__, time(NULL));
					_rtmp_client_reconnect(conn);
				}
			}
			else
			{
				_rtmp_client_reconnect(conn);
			}
			
			free(node);
		}
		g_mutex_unlock(&conn->send_mutex);
		usleep(1000);
	}

	printf("%s:%d %s exit\n", __FILE__, __LINE__, __func__);
	return NULL;
}

static void free_queue_node(gpointer node)
{
	free(node);
}

RTMPConnect* rtmp_client_init(int audio_sample_rate, int audio_bitrate, int audio_channels)
{
	RTMPConnect *conn = (RTMPConnect *)malloc(sizeof(RTMPConnect));
	if(conn == NULL)
		return NULL;
	memset(conn, 0, sizeof(RTMPConnect));

	conn->rtmp_handle = RTMP_Alloc();
	if(conn->rtmp_handle == NULL)
		goto fail;
	
	RTMP_Init(conn->rtmp_handle);
	
	conn->video_handle = video_h264_init();
	if(conn->video_handle == NULL)
		goto fail;

	if(g_video_meta.sps_len == 0 || g_video_meta.pps_len == 0)
	{
		if(video_h264_get_sps_pps(conn->video_handle, &g_video_meta) == 0)
			memcpy(&conn->video_meta, &g_video_meta, sizeof(sps_pps_t));
	}
	else
	{
		memcpy(&conn->video_meta, &g_video_meta, sizeof(sps_pps_t));
	}

	conn->audio_sample_rate = audio_sample_rate;
	conn->audio_bitrate = audio_bitrate;
	conn->audio_channels = audio_channels;
	conn->audio_handle = audio_aacenc_init(audio_sample_rate, audio_bitrate, audio_channels);
	if(conn->audio_handle == NULL)
		goto fail;

	conn->start_ms = get_current_ms();
	
	conn->frame_flow = g_queue_new();
	if(conn->frame_flow == NULL)
		goto fail;
	
	g_mutex_init(&conn->send_mutex);

	if(pthread_create(&conn->send_tid, NULL, sendFrameThread, conn) != 0)
		goto fail;
	
	return conn;

fail:
	if(conn->rtmp_handle)
	{
		RTMP_Close(conn->rtmp_handle);
		RTMP_Free(conn->rtmp_handle);
	}
	if(conn->video_handle)
	{
		video_h264_deinit(conn->video_handle);
	}
	if(conn->audio_handle)
	{
		audio_aacenc_deinit(conn->audio_handle);
	}
	if(conn->frame_flow)
	{
		g_queue_free_full(conn->frame_flow, free_queue_node);
		g_queue_free(conn->frame_flow);
	}
	if(conn->send_tid)
	{
		conn->abort_send = 1;
		pthread_join(conn->send_tid, NULL);
	}
	g_mutex_clear(&conn->send_mutex);
	if(conn)
	{
		free(conn);
	}
	return NULL;
}

int rtmp_client_connect(RTMPConnect *conn, char *url)
{
	strncpy(conn->url, url, sizeof(conn->url)-1);
	conn->rtmp_handle->Link.timeout = 30; //second
	conn->rtmp_handle->Link.lFlags |= RTMP_LF_LIVE;
	if (RTMP_SetupURL(conn->rtmp_handle, url) == FALSE)
		return -1;
	
	RTMP_EnableWrite(conn->rtmp_handle);
	
	if (RTMP_Connect(conn->rtmp_handle, NULL) == FALSE) 
		return -1;

	if (RTMP_ConnectStream(conn->rtmp_handle, 0) == FALSE)
		return -1;
		
	return 0;
}

static int _rtmp_client_write(RTMPConnect *conn, const char *buf, int size)
{
	QueueNode *node = (QueueNode *)malloc(sizeof(QueueNode));
	node->size = size;
	memcpy(node->buffer, buf, size);

	g_mutex_lock(&conn->send_mutex);
	g_queue_push_tail(conn->frame_flow, node);
	g_mutex_unlock(&conn->send_mutex);
	
	return 0;
}

static int get_AACDecoderSpecific_SampleRate_index(int sample_rate)
{
	switch(sample_rate)
	{
		case 5500: return 0;
		case 11025: return 1;
		case 22050: return 2;
		case 44100: return 3;
		default: {
			printf("%s:%d unsupported sample rate\n", __FILE__, __LINE__);
			return -1;
		}
	}
	
	return 0;
}

static int generate_AACDecoderSpecific_byte(
	int sample_rate, int bit_width, int channels, int packet_type,
	unsigned char *first_byte, unsigned char *second_byte)
{
	int sound_format = 10; //AAC
	int sound_rate = get_AACDecoderSpecific_SampleRate_index(sample_rate);
	if(sound_rate < 0)
		return-1;
	
	int sound_size = (bit_width == 8)? 0 : 1;
	int sound_type = (channels == 1)? 0 : 1;
	
	*first_byte = (sound_format<<4 & 0xF0)
		| (sound_rate<<2 & 0x0C)
		| (sound_size<<1 & 0x02)
		| (sound_type & 0x01);

	*second_byte = packet_type;
	
	return 0;
}

static int get_AACSpecificConfig_SampleRate_index(int sample_rate)
{
	switch(sample_rate)
	{
		case 96000: return 0;
		case 88200: return 1;
		case 64000: return 2;
		case 48000: return 3;
		case 44100: return 4;
		case 32000: return 5;
		case 24000: return 6;
		case 22050: return 7;
		case 16000: return 8;
		case 12000: return 9;
		case 11025: return 10;
		case 8000: return 11;
		case 7350: return 12;
		default: {
			printf("%s:%d unsupported sample rate\n", __FILE__, __LINE__);
			return -1;
		}
	}
	
	return 0;
}


static int generate_AACSpecificConfig_byte(
	int sample_rate, int bit_width, int channels, int packet_type,
	unsigned char *first_byte, unsigned char *second_byte)
{
	int audio_object_type = 1; //AAC Main
	int sampling_frequence = get_AACSpecificConfig_SampleRate_index(sample_rate);
	if(sampling_frequence < 0)
		return -1;
	
	int channel_configuration = channels;

	*first_byte = (audio_object_type<< 3 & 0xF8)
		| (sampling_frequence >> 1 & 0x07);

	*second_byte = (sampling_frequence<< 7 & 0x80)
		| (channel_configuration << 3 & 0x78);

	return 0;
}

static int SendFlvAudioHeader(RTMPConnect *conn, uint32_t time_stamp)
{
	uint32_t body_len = 2 + 2; //AudioTagHeader + AudioSpecificConfig
	uint32_t output_len = FLV_TAG_HEAD_LEN + body_len + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	if(output == NULL)
		return -1;

	//Tag Header (11 bytes)
	//Type(1 byte) + Datasize(3 bytes) + Timestamp(3 bytes) + Timestamp_ex(1 byte) + StreamID(3 bytes)
	int offset = 0;	
	output[offset++] = 0x08; //tagtype
	output[offset++] = (uint8_t)(body_len >> 16); //data len
	output[offset++] = (uint8_t)(body_len >> 8); //data len
	output[offset++] = (uint8_t)(body_len); //data len
	output[offset++] = (uint8_t)(time_stamp >> 16); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 8); //time stamp
	output[offset++] = (uint8_t)(time_stamp); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 24); //time stamp
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0
	
	//AudioTagHeader/AACDecoderSpecific (2 bytes)
	//SoundFormat:4 + SoundRate:2 + SoundSize:1 + SoundType:1 + PacketType:8
	//1010(AAC) + 01(11kHz) + 1(16bit) + 0(mono) + 0x00(header, not raw)
	//1010 0110 0000 0000
	//output[offset++] = 0xA6;
	//output[offset++] = 0x00;
	if(generate_AACDecoderSpecific_byte(conn->audio_sample_rate,
		16, conn->audio_channels, 0, &output[offset++], &output[offset++]) < 0)
	{
		free(output);
		return -1;
	}
	
	//AudioSpecificConfig (2 bytes)
	//https://wiki.multimedia.cx/index.php?title=MPEG-4_Audio
	//AudioObjectTypes:5 + SamplingFrequencies:4 + ChannelConfigurations:4 + 0:3
	//00001(AAC Main) + 1010(11025Hz) + 0001(Mono) + 000
	//0000 1101 + 0000 1000
	//output[offset++] = 0x0D;
	//output[offset++] = 0x08;
	if(generate_AACSpecificConfig_byte(conn->audio_sample_rate,
		16, conn->audio_channels, 0, &output[offset++], &output[offset++]) < 0)
	{
		free(output);
		return -1;
	}
	
	//Previous Tag Size
	uint32_t fff = FLV_TAG_HEAD_LEN + body_len;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(_rtmp_client_write(conn, (char *)output, output_len) < 0)
	{
		free(output);
		return -1;
	}
	
	free(output);
	return 0;
}

static int SendFlvAudioFrame(RTMPConnect *conn, unsigned char *framebuf, int framelen, uint32_t timestamp)
{
	uint32_t body_len = 2 + framelen;
	uint32_t output_len = FLV_TAG_HEAD_LEN + body_len + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	
	//Tag Header
	int offset = 0;
	output[offset++] = 0x08; //tagtype audio
	output[offset++] = (uint8_t)(body_len >> 16); //data len
	output[offset++] = (uint8_t)(body_len >> 8); //data len
	output[offset++] = (uint8_t)(body_len); //data len
	output[offset++] = (uint8_t)(timestamp >> 16); //time stamp
	output[offset++] = (uint8_t)(timestamp >> 8); //time stamp
	output[offset++] = (uint8_t)(timestamp); //time stamp
	output[offset++] = (uint8_t)(timestamp >> 24); //time stamp
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0
	
	//AudioTagHeader
	//output[offset++] = 0xA6; //format
	//output[offset++] = 0x01; //aac raw data 
	if(generate_AACDecoderSpecific_byte(conn->audio_sample_rate,
		16, conn->audio_channels, 1, &output[offset++], &output[offset++]) < 0)
	{
		free(output);
		return -1;
	}

	//AudioTagBody
	memcpy(output + offset, framebuf, framelen);
	offset += framelen;
	
	//Previous Tag Size 
	uint32_t fff = FLV_TAG_HEAD_LEN + body_len;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(_rtmp_client_write(conn, (char *)output, output_len) < 0)
	{
		free(output);
		return -1;
	}

	free(output);
	return 0;
}

static int get_aac_frame(unsigned char *frame, int size, void *user_data)
{	
	RTMPConnect *conn = (RTMPConnect *)user_data;
	uint32_t tick = get_current_ms() - conn->start_ms;
	//printf("tick = %u, AAC = %d\n", tick, size);

	SendFlvAudioFrame(conn, frame + AAC_ADTS_HEADER_SIZE, size - AAC_ADTS_HEADER_SIZE, tick);
	return 0;
}

static int SendFlvHeader(RTMPConnect *conn, sps_pps_t *s, uint32_t time_stamp)
{
	/* metadata */
	int width = 640, height = 480, fps = 20;
	h264_decode_sps(s->sps, s->sps_len, width, height, fps);
	printf("%s:%d width = %d, height = %d, frame_rate = %d\n", __FILE__, __LINE__, width, height, fps);

	char buffer[512] = {0};
	char *output = buffer;
	char *outend = buffer + sizeof(buffer);
	
	output = AMF_EncodeString(output, outend, &av_onMetaData);
	*output++ = AMF_ECMA_ARRAY;
	output = AMF_EncodeInt32(output, outend, 10);
	output = AMF_EncodeNamedNumber(output, outend, &av_duration, 0);
	output = AMF_EncodeNamedNumber(output, outend, &av_width, width);
	output = AMF_EncodeNamedNumber(output, outend, &av_height, height);
	output = AMF_EncodeNamedNumber(output, outend, &av_videoframerate, fps);
	output = AMF_EncodeNamedNumber(output, outend, &av_videocodecid, 7); //AVC
	output = AMF_EncodeNamedNumber(output, outend, &av_audiodatarate, conn->audio_bitrate);
	output = AMF_EncodeNamedNumber(output, outend, &av_audiosamplerate, conn->audio_sample_rate);
	output = AMF_EncodeNamedNumber(output, outend, &av_audiosamplesize, 16);
	output = AMF_EncodeNamedBoolean(output, outend, &av_stereo, (conn->audio_channels == 1)? FALSE : TRUE);
	output = AMF_EncodeNamedNumber(output, outend, &av_audiocodecid, 10); //AAC
	output = AMF_EncodeInt24(output, outend, AMF_OBJECT_END);
	uint32_t body_len = output - buffer;

	uint32_t output_len = 9 + 4 + FLV_TAG_HEAD_LEN + body_len + FLV_PRE_TAG_LEN;
	uint8_t *send_buffer = (uint8_t *)malloc(output_len);
	if(send_buffer == NULL)
		return -1;
	memset(send_buffer, 0, output_len);
	
	/* flv header (9 bytes) */
	uint32_t offset = 0;
	send_buffer[offset++] = 'F'; //signature
	send_buffer[offset++] = 'L'; //signature
	send_buffer[offset++] = 'V'; //signature
	send_buffer[offset++] = 0x01; //version
	send_buffer[offset++] = 0x05; //flags
	send_buffer[offset++] = 0x00; //headersize
	send_buffer[offset++] = 0x00; //headersize
	send_buffer[offset++] = 0x00; //headersize
	send_buffer[offset++] = 0x09; //headersize	

	/* previous tag size (4 bytes)  */
	send_buffer[offset++] = 0x00; //previous tag size
	send_buffer[offset++] = 0x00; //previous tag size
	send_buffer[offset++] = 0x00; //previous tag size
	send_buffer[offset++] = 0x00; //previous tag size

	/* tag header (11 bytes) */
	send_buffer[offset++] = 0x12; //tagtype(metadata)
	send_buffer[offset++] = (uint8_t)(body_len >> 16); //data len
	send_buffer[offset++] = (uint8_t)(body_len >> 8); //data len
	send_buffer[offset++] = (uint8_t)(body_len); //data len
	send_buffer[offset++] = (uint8_t)(time_stamp >> 16); //time stamp
	send_buffer[offset++] = (uint8_t)(time_stamp >> 8); //time stamp
	send_buffer[offset++] = (uint8_t)(time_stamp); //time stamp
	send_buffer[offset++] = (uint8_t)(time_stamp >> 24); //time stamp
	send_buffer[offset++] = 0x00; //stream id 0
	send_buffer[offset++] = 0x00; //stream id 0
	send_buffer[offset++] = 0x00; //stream id 0
	memcpy(send_buffer + offset, buffer, body_len);

	/* 4 bytes more ? tag data? previous tag size ? */
	
	if(_rtmp_client_write(conn, (char *)send_buffer, output_len) < 0)
	{
		free(send_buffer);
		return -1;
	}
	
	free(send_buffer);	
	return 0;
}

static int SendFlvSpsPps(RTMPConnect *conn, unsigned char *pps, int pps_len, unsigned char * sps, int sps_len, uint32_t time_stamp)
{
	int body_len = pps_len + sps_len + 16;
	int output_len = FLV_TAG_HEAD_LEN + body_len + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	if(output == NULL)
		return -1;

	//Tag Header (11 bytes)
	uint32_t offset = 0;
	output[offset++] = 0x09; //tagtype video
	output[offset++] = (uint8_t)(body_len >> 16); //data len
	output[offset++] = (uint8_t)(body_len >> 8); //data len
	output[offset++] = (uint8_t)(body_len); //data len
	output[offset++] = (uint8_t)(time_stamp >> 16); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 8); //time stamp
	output[offset++] = (uint8_t)(time_stamp); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 24); //time stamp
	output[offset++] = time_stamp; //stream id 0
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0

	//Video Tag Header
	output[offset++] = 0x17; //key frame + AVC
	output[offset++] = 0x00; //avc sequence header
	output[offset++] = 0x00; //composit time
	output[offset++] = 0x00; // composit time
	output[offset++] = 0x00; //composit time

	//Video Tag Body: AVCDecoderCOnfigurationRecord
	output[offset++] = 0x01; //configurationversion
	output[offset++] = sps[1]; //avcprofileindication
	output[offset++] = sps[2]; //profilecompatibilty
	output[offset++] = sps[3]; //avclevelindication
	output[offset++] = 0xff; //reserved + lengthsizeminusone
	output[offset++] = 0xe1; //numofsequenceset
	output[offset++] = (uint8_t)(sps_len >> 8); //sequence parameter set length high 8 bits
	output[offset++] = (uint8_t)(sps_len); //sequence parameter set  length low 8 bits
	memcpy(output + offset, sps, sps_len); //H264 sequence parameter set
	offset += sps_len;
	
	output[offset++] = 0x01; //numofpictureset
	output[offset++] = (uint8_t)(pps_len >> 8); //picture parameter set length high 8 bits
	output[offset++] = (uint8_t)(pps_len); //picture parameter set length low 8 bits
	memcpy(output + offset, pps, pps_len); //H264 picture parameter set
	offset += pps_len;

	/* previous tag size */
	uint32_t fff = body_len + FLV_TAG_HEAD_LEN;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(_rtmp_client_write(conn, (char *)output, output_len) < 0)
	{
		free(output);
		return -1;
	}

	free(output);
	return 0;
}

static int SendFlvVideoFrame(RTMPConnect *conn, unsigned char *buf, int size, int key_frame, uint32_t time_stamp)
{
	int body_len = size + 5 + 4; //flv VideoTagHeader + NALU length
	int output_len = FLV_TAG_HEAD_LEN + body_len + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	if(output == NULL)
		return-1;
	
	//Tag Header (11 bytes)
	uint32_t offset = 0;
	output[offset++] = 0x09; //tagtype(video)
	output[offset++] = (uint8_t)(body_len >> 16); //data len
	output[offset++] = (uint8_t)(body_len >> 8); //data len
	output[offset++] = (uint8_t)(body_len); //data len
	output[offset++] = (uint8_t)(time_stamp >> 16); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 8); //time stamp
	output[offset++] = (uint8_t)(time_stamp); //time stamp
	output[offset++] = (uint8_t)(time_stamp >> 24); //time stamp
	output[offset++] = time_stamp; //stream id 0
	output[offset++] = 0x00; //stream id 0
	output[offset++] = 0x00; //stream id 0
	
	//Video Tag Header
	if(key_frame)
		output[offset++] = 0x17; //key frame, AVC
	else
		output[offset++] = 0x27; //not key frame, AVC
	output[offset++] = 0x01; //avc raw
	output[offset++] = 0x00; //composit time
	output[offset++] = 0x00; // composit time
	output[offset++] = 0x00; //composit time
	
	output[offset++] = (uint8_t)(size >> 24); //nal length
	output[offset++] = (uint8_t)(size >> 16); //nal length
	output[offset++] = (uint8_t)(size >> 8); //nal length
	output[offset++] = (uint8_t)(size); //nal length
	
	memcpy(output + offset, buf, size);
	offset += size;

	//Previous Tag Size
	uint32_t fff = body_len + FLV_TAG_HEAD_LEN;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(_rtmp_client_write(conn, (char *)output, output_len) < 0)
	{
		free(output);
		return -1;
	}

	free(output);
	return 0;
}

static int get_h264_frame(unsigned char *frame, int size, void *user_data)
{
	RTMPConnect *conn = (RTMPConnect *)user_data;
	uint32_t tick = get_current_ms() - conn->start_ms;

	unsigned char *framebuf = (unsigned char *)malloc(BUFFER_SIZE);
	if(framebuf == NULL)
		return -1;	
	memcpy(framebuf, frame, size);

	NaluUnit *nalu = (NaluUnit *)malloc(sizeof(NaluUnit));
	if(nalu == NULL)
	{
		free(framebuf);
		return -1;
	}

	int startcodelen = 0;
	unsigned char *s = find_h264_startcode(framebuf, framebuf+size, &startcodelen);
	if(s == NULL)
		return -1;

	int key_frame = 0;
	while(s < framebuf + size)
	{
		s = getOneNaluFromBuf(s, framebuf+size, nalu);
		if(nalu->type == 0x07 || nalu->type == 0x08)
			continue;
		
		key_frame = (nalu->type == 0x05) ? TRUE : FALSE;
		SendFlvVideoFrame(conn, nalu->data, nalu->size, key_frame, tick);
		//printf("tick = %u, NAL = %d\n", tick, nalu->size);
	}

	free(nalu);
	free(framebuf);
	return 0;
}

int rtmp_client_publish(RTMPConnect *conn)
{
	video_h264_clear_source_buffer(conn->video_handle);

	uint32_t tick = get_current_ms() - conn->start_ms;
	SendFlvHeader(conn, &conn->video_meta, tick);
	SendFlvSpsPps(conn, conn->video_meta.pps, conn->video_meta.pps_len, conn->video_meta.sps, conn->video_meta.sps_len, tick);
	video_h264_encode(conn->video_handle, get_h264_frame, conn);

	SendFlvAudioHeader(conn, tick);
	audio_aacenc_encode(conn->audio_handle, get_aac_frame, conn);
	
	return 0;
}

int rtmp_client_disconnect(RTMPConnect *conn)
{
	return 0;
}

int rtmp_client_deinit(RTMPConnect *conn)
{
	if(conn->video_handle)
	{
		video_h264_deinit(conn->video_handle);
	}
	if(conn->audio_handle)
	{
		audio_aacenc_deinit(conn->audio_handle);
	}
	if(conn->rtmp_handle)
	{
		RTMP_Close(conn->rtmp_handle);
		RTMP_Free(conn->rtmp_handle);
	}
	if(conn->send_tid)
	{
		conn->abort_send = 1;
		pthread_join(conn->send_tid, NULL);
	}
	g_mutex_clear(&conn->send_mutex);
	if(conn->frame_flow)
	{
		g_queue_free_full(conn->frame_flow, free_queue_node);
		g_queue_free(conn->frame_flow);
	}
	if(conn)
	{
		free(conn);
	}
	
	return 0;
}

