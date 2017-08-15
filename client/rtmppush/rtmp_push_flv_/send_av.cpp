#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "librtmp/rtmp.h"   
#include "librtmp/rtmp_sys.h"   
#include "librtmp/amf.h"
#include "sps_decode.h"
#include "send_av.h"

#define RTMP_HEAD_SIZE   (sizeof(RTMPPacket)+RTMP_MAX_HEADER_SIZE)
#define BUFFER_SIZE 2*1024*1024

static uint8_t start_code3[] = {0x00, 0x00, 0x01};
static uint8_t start_code4[] = {0x00, 0x00, 0x00, 0x01};

static sps_pps_t g_video_meta = {0};

static const AVal av_onMetaData = AVC("onMetaData");
static const AVal av_duration = AVC("duration");
static const AVal av_width = AVC("width");
static const AVal av_height = AVC("height");
static const AVal av_videocodecid = AVC("videocodecid");
static const AVal av_avcprofile = AVC("avcprofile");
static const AVal av_avclevel = AVC("avclevel");
static const AVal av_videoframerate = AVC("videoframerate");
static const AVal av_audiocodecid = AVC("audiocodecid");
static const AVal av_audiosamplerate = AVC("audiosamplerate");
static const AVal av_audiochannels = AVC("audiochannels");
static const AVal av_avc1 = AVC("avc1");
static const AVal av_mp4a  = AVC("mp4a");
static const AVal av_onPrivateData = AVC("onPrivateData");
static const AVal av_record = AVC("record");

#define FLV_TAG_HEAD_LEN 11
#define FLV_PRE_TAG_LEN 4

typedef struct _NaluUnit
{
	int type;
	int size;
	unsigned char data[BUFFER_SIZE];
}NaluUnit;

static int64_t get_current_ms()
{
	struct timespec tm;
	if(clock_gettime(CLOCK_MONOTONIC, &tm) < 0)
		return -1;

	return (int64_t)tm.tv_sec*1000 + (int64_t)tm.tv_nsec/1000000;
}

static int SendVideoSpsPps(RTMP *handle, unsigned char *pps, int pps_len, unsigned char * sps, int sps_len)
{
	RTMPPacket *packet = (RTMPPacket *)malloc(RTMP_HEAD_SIZE+1024);
	//RTMPPacket_Reset(packet);
	memset(packet, 0, RTMP_HEAD_SIZE+1024);
	
	packet->m_body = (char *)packet + RTMP_HEAD_SIZE;
	unsigned char *body = (unsigned char *)packet->m_body;
	
	int i = 0;
	body[i++] = 0x17;
	body[i++] = 0x00;

	body[i++] = 0x00;
	body[i++] = 0x00;
	body[i++] = 0x00;

	/*AVCDecoderConfigurationRecord*/
	body[i++] = 0x01;
	body[i++] = sps[1];
	body[i++] = sps[2];
	body[i++] = sps[3];
	body[i++] = 0xff;

	/*sps*/
	body[i++]  = 0xe1;
	body[i++] = (sps_len >> 8) & 0xff;
	body[i++] = sps_len & 0xff;
	memcpy(&body[i],sps,sps_len);
	i +=  sps_len;

	/*pps*/
	body[i++]  = 0x01;
	body[i++] = (pps_len >> 8) & 0xff;
	body[i++] = (pps_len) & 0xff;
	memcpy(body+i, pps, pps_len);
	i +=  pps_len;

	packet->m_packetType = RTMP_PACKET_TYPE_VIDEO;
	packet->m_nBodySize = i;
	packet->m_nChannel = 0x04;
	packet->m_nTimeStamp = 0;
	packet->m_hasAbsTimestamp = 0;
	packet->m_headerType = RTMP_PACKET_SIZE_MEDIUM;
	packet->m_nInfoField2 = handle->m_stream_id;

	if(RTMP_SendPacket(handle, packet, TRUE) == FALSE)
	{
		free(packet);
		return -1;
	}
	
	free(packet);
	return 0;
}

static int SendPacket(RTMP *handle, unsigned int nPacketType, unsigned char *data, unsigned int size, unsigned int nTimestamp)  
{
	RTMPPacket* packet;
	packet = (RTMPPacket *)malloc(RTMP_HEAD_SIZE+size);
	memset(packet, 0, RTMP_HEAD_SIZE+size);
	
	packet->m_body = (char *)packet + RTMP_HEAD_SIZE;
	packet->m_nBodySize = size;
	memcpy(packet->m_body,data,size);
	packet->m_hasAbsTimestamp = 0;
	packet->m_packetType = nPacketType; /* video or audio*/
	packet->m_nInfoField2 = handle->m_stream_id;
	packet->m_nChannel = 0x04;
	packet->m_headerType = RTMP_PACKET_SIZE_LARGE;
	if (RTMP_PACKET_TYPE_AUDIO ==nPacketType && size !=4)
	{
		packet->m_headerType = RTMP_PACKET_SIZE_MEDIUM;
	}
	packet->m_nTimeStamp = nTimestamp;
	
	if (RTMP_IsConnected(handle) == FALSE)
		goto fail;

	/*the third paramter: TRUE: put into queue and wait to be send, FALSE: send directly*/
	if(RTMP_SendPacket(handle, packet, TRUE) == FALSE)
		goto fail;
	
	free(packet);
	return 0;
	
fail:
	free(packet);
	return -1;
}  

static int SendH264Packet(RTMPConnect *conn, unsigned char *data, unsigned int size, int bIsKeyFrame, unsigned int nTimeStamp)  
{
	if(data == NULL && size<11)
		return -1;
	
	unsigned char *body = (unsigned char*)malloc(size+9);
	if(body == NULL)
		return -1;

	int i = 0; 
	if(bIsKeyFrame){  
		body[i++] = 0x17;// 1:Iframe  7:AVC   
		body[i++] = 0x01;// AVC NALU   
		body[i++] = 0x00;  
		body[i++] = 0x00;  
		body[i++] = 0x00;  

		// NALU size
		body[i++] = size>>24 &0xff;  
		body[i++] = size>>16 &0xff;  
		body[i++] = size>>8 &0xff;  
		body[i++] = size&0xff;
		
		// NALU data   
		memcpy(body + i, data, size);
		if(SendVideoSpsPps(conn->rtmp_handle, conn->video_meta.pps, conn->video_meta.pps_len, conn->video_meta.sps, conn->video_meta.sps_len) < 0)
			goto fail;
	}else{  
		body[i++] = 0x27;// 2:Pframe  7:AVC   
		body[i++] = 0x01;// AVC NALU   
		body[i++] = 0x00;  
		body[i++] = 0x00;  
		body[i++] = 0x00;  

		// NALU size   
		body[i++] = size>>24 &0xff;  
		body[i++] = size>>16 &0xff;  
		body[i++] = size>>8 &0xff;  
		body[i++] = size&0xff;
		
		// NALU data   
		memcpy(body + i, data, size);  
	}  
	
	if(SendPacket(conn->rtmp_handle, RTMP_PACKET_TYPE_VIDEO, body, i+size, nTimeStamp) < 0)
		goto fail;
	
	free(body);  
	return 0;

fail:
	free(body);
	return -1;
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

static int SendAudioHeader(RTMP *handle)
{
	RTMPPacket packet;
	RTMPPacket_Reset(&packet);
	RTMPPacket_Alloc(&packet, 4);  

	packet.m_body[0] = 0xAF;  //AAC,44kHZ,16bit,stereo
	packet.m_body[1] = 0x00; //AAC sequence header
	packet.m_body[2] = 0x11;
	packet.m_body[3] = 0x90; //AACLC,48kHZ,stereo,0

	packet.m_headerType = RTMP_PACKET_SIZE_MEDIUM;
	packet.m_packetType = RTMP_PACKET_TYPE_AUDIO;
	packet.m_hasAbsTimestamp = 0;
	packet.m_nChannel = 0x05; //audio channel
	packet.m_nTimeStamp = 0;
	packet.m_nInfoField2 = handle->m_stream_id;
	packet.m_nBodySize  = 4;

	int nRet = RTMP_SendPacket(handle, &packet, TRUE);
	RTMPPacket_Free(&packet);
	return nRet;
}

static int SendAudioPacket(RTMP *handle, unsigned char *framebuf, int framelen, uint32_t timestamp)
{
	int size = framelen + 2;
	RTMPPacket packet;
	RTMPPacket_Reset(&packet);
	RTMPPacket_Alloc(&packet, size);

	int i=0;
	
	packet.m_body[i++] = 0xAF; // MP3 AAC format 48000Hz
	packet.m_body[i++] = 0x01;
	memcpy(&packet.m_body[i], framebuf, framelen);

	packet.m_headerType  = RTMP_PACKET_SIZE_MEDIUM;
	packet.m_packetType = RTMP_PACKET_TYPE_AUDIO;
	packet.m_hasAbsTimestamp = 0;
	packet.m_nChannel   = 0x05;
	packet.m_nTimeStamp = timestamp;
	packet.m_nInfoField2 = handle->m_stream_id;
	packet.m_nBodySize = size;

	int nRet = RTMP_SendPacket(handle, &packet, TRUE);
	RTMPPacket_Free(&packet);
	return nRet;
}

RTMPConnect* rtmp_client_init()
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

	conn->audio_handle = audio_aacenc_init();
	if(conn->audio_handle == NULL)
		goto fail;

	conn->start_ms = get_current_ms();

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
	if(conn)
	{
		free(conn);
	}
	return NULL;
}

int rtmp_client_connect(RTMPConnect *conn, char *url)
{
	if (RTMP_SetupURL(conn->rtmp_handle, url) == FALSE)
		return -1;
	
	RTMP_EnableWrite(conn->rtmp_handle);
	
	if (RTMP_Connect(conn->rtmp_handle, NULL) == FALSE) 
		return -1;

	if (RTMP_ConnectStream(conn->rtmp_handle, 0) == FALSE)
		return -1;
		
	return 0;
}

static int get_aac_frame(unsigned char *frame, int size, void *user_data)
{	
	RTMPConnect *conn = (RTMPConnect *)user_data;
	uint32_t tick = get_current_ms() - conn->start_ms;
	printf("tick = %u, AAC  = %d\n", tick, size);

	SendAudioPacket(conn->rtmp_handle, frame, size, tick);
	
	return 0;
}

static int SendFlvVideoHeader(RTMP *handle)
{
	/* metadata */
	char buffer[512];
	char *output = buffer;
	char *outend = buffer + sizeof(buffer);
	
	output = AMF_EncodeString(output, outend, &av_onMetaData);
	*output++ = AMF_ECMA_ARRAY;
	output = AMF_EncodeInt32(output, outend, 3);
	output = AMF_EncodeNamedNumber(output, outend, &av_duration, 0.0);
	output = AMF_EncodeNamedNumber(output, outend, &av_videocodecid, 7); //AVC
	output = AMF_EncodeNamedNumber(output, outend, &av_audiocodecid, 10); //AAC
	output = AMF_EncodeInt24(output, outend, AMF_OBJECT_END);
	
	uint32_t body_len = output - buffer;

	/* flv header */
	char send_buffer[512];
	uint32_t offset = 0;
	uint32_t output_len = body_len + FLV_TAG_HEAD_LEN + FLV_PRE_TAG_LEN;
	int64_t ts_us = 0;
	
	send_buffer[offset++] = 0x12; //tagtype metadata
	send_buffer[offset++] = (uint8_t)(body_len >> 16); //data len
	send_buffer[offset++] = (uint8_t)(body_len >> 8); //data len
	send_buffer[offset++] = (uint8_t)(body_len); //data len
	send_buffer[offset++] = (uint8_t)(ts_us >> 16); //time stamp
	send_buffer[offset++] = (uint8_t)(ts_us >> 8); //time stamp
	send_buffer[offset++] = (uint8_t)(ts_us); //time stamp
	send_buffer[offset++] = (uint8_t)(ts_us >> 24); //time stamp
	send_buffer[offset++] = 0x00; //stream id 0
	send_buffer[offset++] = 0x00; //stream id 0
	send_buffer[offset++] = 0x00; //stream id 0

	memcpy(send_buffer + offset, buffer, body_len); //H264 sequence parameter set
	if(RTMP_Write(handle, send_buffer, output_len) == FALSE)
		return -1;

	return 0;
}

static int SendFlvSpsPps(RTMP *handle, unsigned char *pps, int pps_len, unsigned char * sps, int sps_len, uint32_t time_stamp)
{
	int body_len = pps_len + sps_len + 16;
	int output_len = body_len + FLV_TAG_HEAD_LEN + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	uint32_t offset = 0;

	// FLV TAG HEADER
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

	//FLV VideoTagHeader
	output[offset++] = 0x17; //key frame, AVC
	output[offset++] = 0x00; //avc sequence header
	output[offset++] = 0x00; //composit time
	output[offset++] = 0x00; // composit time
	output[offset++] = 0x00; //composit time

	//flv VideoTagBody --AVCDecoderCOnfigurationRecord
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
	
	uint32_t fff = body_len + FLV_TAG_HEAD_LEN;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(RTMP_Write(handle, (const char *)output, output_len) == FALSE)
	{
		free(output);
		return -1;
	}
	
	free(output);
	return 0;
}

static int SendFlvVideoFrame(RTMP *handle, unsigned char *buf, int size, int key_frame, uint32_t time_stamp)
{
	int body_len = size + 5 + 4; //flv VideoTagHeader + NALU length
	int output_len = body_len + FLV_TAG_HEAD_LEN + FLV_PRE_TAG_LEN;
	uint8_t *output = (uint8_t *)malloc(output_len);
	uint32_t offset = 0;
	
	// FLV TAG HEADER
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
	
	//FLV VideoTagHeader
	if(key_frame)
		output[offset++] = 0x17; //key frame, AVC
	else
		output[offset++] = 0x27; //not key frame, AVC

	output[offset++] = 0x01; //avc sequence header
	output[offset++] = 0x00; //composit time
	output[offset++] = 0x00; // composit time
	output[offset++] = 0x00; //composit time
	
	output[offset++] = (uint8_t)(size >> 24); //nal length
	output[offset++] = (uint8_t)(size >> 16); //nal length
	output[offset++] = (uint8_t)(size >> 8); //nal length
	output[offset++] = (uint8_t)(size); //nal length
	memcpy(output + offset, buf, size);
	
	offset += size;
	uint32_t fff = body_len + FLV_TAG_HEAD_LEN;
	output[offset++] = (uint8_t)(fff >> 24); //data len
	output[offset++] = (uint8_t)(fff >> 16); //data len
	output[offset++] = (uint8_t)(fff >> 8); //data len
	output[offset++] = (uint8_t)(fff); //data len

	if(RTMP_Write(handle, (const char *)output, output_len) == FALSE)
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

	int startcodelen;
	unsigned char *s = find_h264_startcode(framebuf, framebuf+size, &startcodelen);
	if(s == NULL)
		return -1;

	int key_frame;
	while(s < framebuf + size)
	{
		s = getOneNaluFromBuf(s, framebuf+size, nalu);
		if(nalu->type == 0x07 || nalu->type == 0x08)
			continue;
		
		key_frame = (nalu->type == 0x05) ? TRUE : FALSE;
		//SendH264Packet(conn, nalu->data, nalu->size, key_frame, tick);
		SendFlvVideoFrame(conn->rtmp_handle, nalu->data, nalu->size, key_frame, tick);
		printf("tick = %u, NAL = %d\n", tick, nalu->size);
	}

	free(nalu);
	free(framebuf);
	return 0;
}

int rtmp_client_publish(RTMPConnect *conn)
{
	SendFlvVideoHeader(conn->rtmp_handle);
	SendFlvSpsPps(conn->rtmp_handle, conn->video_meta.pps, conn->video_meta.pps_len, conn->video_meta.sps, conn->video_meta.sps_len, 0);
	video_h264_encode(conn->video_handle, get_h264_frame, conn);
	
	//SendAudioHeader(conn->rtmp_handle);
	//audio_aacenc_encode(conn->audio_handle, get_aac_frame, conn);
	
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
	if(conn)
	{
		free(conn);
	}
	
	return 0;
}

