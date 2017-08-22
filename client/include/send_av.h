#ifndef __LIBRTMP_SEND264_H__
#define __LIBRTMP_SEND264_H__

#include <glib.h>
#include <pthread.h>
#include "librtmp/rtmp.h"
#include "video_h264.h"
#include "audio_aacenc.h"

typedef struct _RTMPConnect
{
	char url[128];
	RTMP *rtmp_handle;
	uint32_t start_ms;
	
	video_h264_t *video_handle;
	sps_pps_t video_meta;

	int audio_sample_rate;
	int audio_bitrate;
	int audio_channels;
	audio_aacenc_handle audio_handle;
	
	int abort_send;
	pthread_t send_tid;
	GQueue *frame_flow;
	GMutex send_mutex;
}RTMPConnect;

RTMPConnect* rtmp_client_init(int audio_sample_rate, int audio_bitrate, int audio_channels);
int rtmp_client_connect(RTMPConnect *conn, char *url);
int rtmp_client_publish(RTMPConnect *conn);
int rtmp_client_disconnect(RTMPConnect *conn);
int rtmp_client_deinit(RTMPConnect *conn);

#endif

