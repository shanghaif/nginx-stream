#ifndef __LIBRTMP_SEND264_H__
#define __LIBRTMP_SEND264_H__

#include "librtmp/rtmp.h"
#include "video_h264.h"
#include "audio_aacenc.h"

typedef struct _RTMPConnect
{
	RTMP *rtmp_handle;
	video_h264_t *video_handle;
	sps_pps_t video_meta;
	audio_aacenc_handle audio_handle;
	uint32_t start_ms;
}RTMPConnect;

RTMPConnect* rtmp_client_init();
int rtmp_client_connect(RTMPConnect *conn, char *url);
int rtmp_client_publish(RTMPConnect *conn);
int rtmp_client_disconnect(RTMPConnect *conn);
int rtmp_client_deinit(RTMPConnect *conn);

#endif

