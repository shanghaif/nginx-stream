#ifndef __VIDEO_H264_H__
#define __VIDEO_H264_H__

#include <pthread.h>
#include "am_bstream.h"

typedef int (*GetVideoFrame)(unsigned char *frame, int size, void *user_data);

typedef struct sps_pps_s
{
	int sps_len;
	unsigned char sps[1024];
	int pps_len;
	unsigned char pps[1024];
}sps_pps_t;

typedef struct video_h264_s
{
	int abort;
	pthread_t tid;
	int pause;

	am_bs_handle handle;
	GetVideoFrame get_frame;
	void *user_data;
}video_h264_t;

video_h264_t* video_h264_init();
int video_h264_deinit(video_h264_t *vh);

int video_h264_get_sps_pps(video_h264_t *vh, sps_pps_t *sps_pps);
int video_h264_clear_source_buffer(video_h264_t *vh);
int video_h264_encode(video_h264_t *vh, GetVideoFrame get_frame, void *user_data);

int video_h264_pause(video_h264_t *vh);
int video_h264_resume(video_h264_t *vh);

#endif

