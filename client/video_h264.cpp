#include <stdio.h>
#include <malloc.h>
#include <string.h>
#include <unistd.h>

#include "video_h264.h"

static uint8_t start_code3[] = {0x00, 0x00, 0x01};
static uint8_t start_code4[] = {0x00, 0x00, 0x00, 0x01};

#define BUFFER_SIZE 2*1024*1024

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

video_h264_t* video_h264_init()
{
	video_h264_t *vh = (video_h264_t *)malloc(sizeof(video_h264_t));
	if(vh == NULL)
		return NULL;
	
	memset(vh, 0, sizeof(video_h264_t));
	
	vh->handle = am_bs_init("/dev/iav", 2);
	if(vh->handle == NULL)
		goto fail;

	return vh;

fail:
	if(vh->handle)
		am_bs_deinit(vh->handle);
	if(vh)
		free(vh);
	return NULL;
}

int video_h264_get_sps_pps(video_h264_t *vh, sps_pps_t *sps_pps)
{
	int framelen, startcodelen;
	unsigned char *s;
	am_bs_frame_info info;

	unsigned char *framebuf = (unsigned char *)malloc(BUFFER_SIZE);
	if(framebuf == NULL)
		return -1;

	NaluUnit *nalu = (NaluUnit *)malloc(sizeof(NaluUnit));
	if(nalu == NULL)
	{
		free(framebuf);
		return -1;
	}

	while(vh->abort == 0)
	{
		if(am_bs_get_one_frame(vh->handle, &info, 0) < 0
			|| info.data_size == 0
			|| info.data_size > BUFFER_SIZE)
			continue;
		
		framelen = info.data_size;
		memcpy(framebuf, info.data_addr, info.data_size);

		s = find_h264_startcode(framebuf, framebuf+framelen, &startcodelen);
		if(s == NULL)
			continue;
		
		while(s < framebuf + framelen)
		{
			s = getOneNaluFromBuf(s, framebuf+framelen, nalu);
			
			if(nalu->type == 0x07)
			{
				sps_pps->sps_len = nalu->size;
				memcpy(sps_pps->sps, nalu->data, nalu->size);
			}
			else if(nalu->type == 0x08)
			{
				sps_pps->pps_len = nalu->size;
				memcpy(sps_pps->pps, nalu->data, nalu->size);
			}

			if(sps_pps->sps_len && sps_pps->pps_len)
			{
				goto got_sps_pps;
			}
		}
	}

got_sps_pps:
	
	free(framebuf);
	free(nalu);
	return 0;
}

void* h264EncodeThread(void *arg)
{
	video_h264_t *vh = (video_h264_t *)arg;
	am_bs_frame_info info;

	while(vh->abort == 0)
	{
		if(vh->pause)
			usleep(100*1000);
	
		if(am_bs_get_one_frame(vh->handle, &info, 0) < 0)
			continue;
		
		if(info.data_size > BUFFER_SIZE || info.data_size == 0)
			continue;

		if(vh->get_frame)
			vh->get_frame(info.data_addr, info.data_size, vh->user_data);
	}

	printf("%s:%d %s exit\n", __FILE__, __LINE__, __func__);
	return NULL;	
}

int video_h264_encode(video_h264_t *vh, GetVideoFrame get_frame, void *user_data)
{
	vh->get_frame = get_frame;
	vh->user_data = user_data;

	if(pthread_create(&vh->tid, NULL, h264EncodeThread, vh) != 0)
		return -1;

	return 0;
}

int video_h264_clear_source_buffer(video_h264_t *vh)
{
	am_bs_frame_info info;
	int64_t last = get_current_ms();
	int64_t curr;

	while(vh->abort == 0)
	{
		if(am_bs_get_one_frame(vh->handle, &info, 0) >= 0)
		{
			curr = get_current_ms();
			if(curr - last > 10)
				return 0;
			last = curr;
		}
	}
	
	return 0;
}


int video_h264_pause(video_h264_t *vh)
{
	vh->pause = 1;
	printf("%s:%d video encode paused\n", __FILE__, __LINE__);
	return 0;
}

int video_h264_resume(video_h264_t *vh)
{
	vh->pause = 0;
	printf("%s:%d video encode resumed\n", __FILE__, __LINE__);
	return 0;
}

int video_h264_deinit(video_h264_t *vh)
{
	if(vh->tid)
	{
		vh->abort = 1;
		pthread_join(vh->tid, NULL);
	}
	if(vh->handle)
	{
		am_bs_deinit(vh->handle);
	}
	if(vh)
	{
		free(vh);
	}
	return 0;
}

