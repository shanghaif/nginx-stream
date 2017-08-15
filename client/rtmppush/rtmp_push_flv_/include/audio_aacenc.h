#ifndef __AUDIO_AACENC_H__
#define __AUDIO_AACENC_H__

typedef void* audio_aacenc_handle;
typedef int (*GetAudioFrame)(unsigned char *frame, int size, void *user_data);

audio_aacenc_handle audio_aacenc_init();
int audio_aacenc_deinit(audio_aacenc_handle h);

int audio_aacenc_encode(audio_aacenc_handle h, GetAudioFrame get_frame, void *user_data);

int audio_aacenc_pause(audio_aacenc_handle h);
int audio_aacenc_resume(audio_aacenc_handle h);

#endif

