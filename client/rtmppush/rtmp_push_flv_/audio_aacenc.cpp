/*
 * test_audio.c
 *
 * History:
 *	2008/06/27 - [Cao Rongrong] created file
 *	2008/11/14 - [Cao Rongrong] support PAUSE and RESUME
 *	2009/02/24 - [Cao Rongrong] add duplex, playback support more format
 *	2009/03/02 - [Cao Rongrong] add xrun
 *
 *	Copyright (C) 2007-2008, Ambarella, Inc.
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *  This program will record the sound data to a file. It will run almost infinite,
 *  you can type "CTRL + C" to terminate it.
 *
 *  When the file is recorded, you can play it by "aplay". But you should pay
 *  attention to the option of "aplay", if the option is incorrect, you may hear
 *  noise rather than the sound you record just now.
 */


#include <alsa/asoundlib.h>
#include <assert.h>
#include <sys/signal.h>
#include <sys/time.h>
#include <basetypes.h>
#include <string.h>
#include <getopt.h>
#include <time.h>
#include <pthread.h>

#include "formats.h"
#include "aac_audio_enc.h"
#include "audio_aacenc.h"

typedef struct audio_aacenc_s
{
	int abort;
	pthread_t tid;
	int pause;
	
	snd_pcm_t *pcm_handle;
	snd_pcm_format_t pcm_format;
	unsigned int audio_channel;
	unsigned int sample_rate;
	snd_pcm_uframes_t chunk_size;
	size_t bits_per_sample, bits_per_frame;

	int channel_id;	
	au_aacenc_config_t aaccfg;
	u8 mpTmpEncBuf[106000];
	u8 outputBuffer[(6144/8)*2+100];

	GetAudioFrame get_audio_frame;
	void *priv_data;
}audio_aacenc_t;

static snd_pcm_uframes_t set_pcm_parameter(snd_pcm_t *handle, snd_pcm_stream_t stream, audio_aacenc_t *enc)
{
	snd_pcm_hw_params_t *params;
	snd_pcm_sw_params_t *swparams;
	snd_pcm_hw_params_alloca(&params);
	snd_pcm_sw_params_alloca(&swparams);

	int err = snd_pcm_hw_params_any(handle, params);
	if (err < 0) {
		printf("%s:%d Broken configuration for this PCM: no configurations available\n", __FILE__, __LINE__);
		return 0;
	}

	err = snd_pcm_hw_params_set_access(handle, params,
			SND_PCM_ACCESS_RW_INTERLEAVED);
	if (err < 0) {
		printf("%s:%d Access type not available\n", __FILE__, __LINE__);
		return 0;
	}

	printf("%s:%d format = %s, channels = %d, rate = %d\n", __FILE__, __LINE__,
		snd_pcm_format_name(enc->pcm_format), enc->audio_channel, enc->sample_rate);

	//err = snd_pcm_hw_params_set_format(handle, params, hwparams.format);
	if (enc->pcm_format == SND_PCM_FORMAT_U8) {
		err = snd_pcm_hw_params_set_format(handle, params, SND_PCM_FORMAT_U8);
	} else {
		err = snd_pcm_hw_params_set_format(handle, params, SND_PCM_FORMAT_S16_LE);
	}
	if (err < 0) {
		printf("%s:%d Sample format non available\n", __FILE__, __LINE__);
		return 0;
	}

	//err = snd_pcm_hw_params_set_channels(handle, params, 2);
	err = snd_pcm_hw_params_set_channels(handle, params, enc->audio_channel);
	if (err < 0) {
		printf("%s:%d Channels count non available\n", __FILE__, __LINE__);
		return 0;
	}

	err = snd_pcm_hw_params_set_rate(handle, params, enc->sample_rate, 0);
	if (err < 0) {
		printf("%s:%d Rate non available\n", __FILE__, __LINE__);
		return 0;
	}

	unsigned buffer_time = 0;
	err = snd_pcm_hw_params_get_buffer_time_max(params, &buffer_time, 0);
	assert(err >= 0);
	if (buffer_time > 500000)
		buffer_time = 500000;

	unsigned period_time = buffer_time / 4; /* 125ms */
	err = snd_pcm_hw_params_set_period_time_near(handle, params, &period_time, 0);
	assert(err >= 0);

	err = snd_pcm_hw_params_set_buffer_time_near(handle, params, &buffer_time, 0);
	assert(err >= 0);

	err = snd_pcm_hw_params(handle, params);
	if (err < 0) {
		printf("%s:%d Unable to install hw params\n", __FILE__, __LINE__);
		return 0;
	}
	
	snd_pcm_uframes_t chunk_size = 0;
	snd_pcm_hw_params_get_period_size(params, &chunk_size, 0);
	snd_pcm_uframes_t buffer_size = 0;
	snd_pcm_hw_params_get_buffer_size(params, &buffer_size);
	if (chunk_size == buffer_size) {
		printf("%s:%d Can't use period equal to buffer size (%lu == %lu)\n", __FILE__, __LINE__, chunk_size, buffer_size);
		return 0;
	}

	snd_pcm_sw_params_current(handle, swparams);

	err = snd_pcm_sw_params_set_avail_min(handle, swparams, chunk_size);

	snd_pcm_uframes_t start_threshold;
	if(stream == SND_PCM_STREAM_PLAYBACK)
		start_threshold = (buffer_size / chunk_size) * chunk_size;
	else
		start_threshold = 1;
	err = snd_pcm_sw_params_set_start_threshold(handle, swparams, start_threshold);
	assert(err >= 0);

	err = snd_pcm_sw_params_set_stop_threshold(handle, swparams, buffer_size);
	assert(err >= 0);

	if (snd_pcm_sw_params(handle, swparams) < 0) {
		printf("%s:%d unable to install sw params\n", __FILE__, __LINE__);
		return 0;
	}
	if (enc->pcm_format == SND_PCM_FORMAT_U8) {
		enc->bits_per_sample = snd_pcm_format_physical_width(SND_PCM_FORMAT_U8);
	} else {
		enc->bits_per_sample = snd_pcm_format_physical_width(SND_PCM_FORMAT_S16_LE);
	}

	//bits_per_frame = bits_per_sample * 2;
	enc->bits_per_frame = enc->bits_per_sample * enc->audio_channel;

	size_t chunk_bytes = chunk_size * enc->bits_per_frame / 8;
	printf("%s:%d chunk_size = %d, chunk_bytes = %d, buffer_size = %d\n\n",
		__FILE__, __LINE__, (int)chunk_size, chunk_bytes, (int)buffer_size);

	return chunk_size;
}

/* I/O error handler */
static void xrun(audio_aacenc_t *enc, snd_pcm_stream_t stream)
{
	int res;
	snd_pcm_status_t *status;
	snd_pcm_status_alloca(&status);
	if ((res = snd_pcm_status(enc->pcm_handle, status))<0) {
		printf("%s:%d pcm status error: %s\n", __FILE__, __LINE__, snd_strerror(res));
		return;
	}
	
	if (snd_pcm_status_get_state(status) == SND_PCM_STATE_XRUN) {
		struct timeval now, diff, tstamp;
		gettimeofday(&now, 0);
		snd_pcm_status_get_trigger_tstamp(status, &tstamp);
		timersub(&now, &tstamp, &diff);
		fprintf(stderr, "%s!!! (at least %.3f ms long)\n",
			stream == SND_PCM_STREAM_PLAYBACK ? "underrun" : "overrun",
			diff.tv_sec * 1000 + diff.tv_usec / 1000.0);

		if ((res = snd_pcm_prepare(enc->pcm_handle))<0) {
			printf("xrun: prepare error: %s\n", snd_strerror(res));
			return;
		}
		return; /* ok, data should be accepted again */
	} else if (snd_pcm_status_get_state(status) == SND_PCM_STATE_DRAINING) {
		printf("draining!!!\n");
		if (stream == SND_PCM_STREAM_CAPTURE) {
			fprintf(stderr, "capture stream format change? attempting recover...\n");
			if ((res = snd_pcm_prepare(enc->pcm_handle))<0) {
				printf("xrun(DRAINING): prepare error: %s", snd_strerror(res));
				return;
			}
			return;
		}
	}

	return;
}

static size_t pcm_read_raw(audio_aacenc_t *enc, snd_pcm_uframes_t chunk_size, u_char *data, size_t rcount)
{
	ssize_t r;
	size_t result = 0;
	
	size_t count = rcount;
	if (count != chunk_size) {
		count = chunk_size;
	}

	while (count > 0) {
		r = snd_pcm_readi(enc->pcm_handle, data, count);
		if (r == -EAGAIN || (r >= 0 && (size_t)r < count)) {
			snd_pcm_wait(enc->pcm_handle, 1000);
		} else if (r == -EPIPE) {
			xrun(enc, SND_PCM_STREAM_CAPTURE);
		} else if (r < 0) {
			printf("%s:%d read error: %s", __FILE__, __LINE__, snd_strerror(r));
			return -1;
		}

		if (r > 0) {
			result += r;
			count -= r;
			data += r * enc->bits_per_frame / 8;
		}
	}

	return result;
}

static size_t handle_data_copy(audio_aacenc_t *enc, snd_pcm_uframes_t chunk_size, u_char *data, u_char *tmp)
{
	size_t i, tmp_cnt;
	size_t chunk_bytes = chunk_size * enc->bits_per_frame / 8;

	if ((enc->audio_channel == 2) && (enc->channel_id != -1)) {
		tmp_cnt = chunk_bytes >> 1;
		if (enc->pcm_format == SND_PCM_FORMAT_U8) {
			for (i = 0; i < tmp_cnt; i++) {
				if(enc->channel_id)
					*(tmp + i) = *(data + i * 2 + 1);
				else
					*(tmp + i) = *(data + i * 2);
			}
		} else {
			for (i = 0; i < tmp_cnt; i++) {
				if(enc->channel_id)
					*((u_short *)tmp + i) = *((u_short *)data + i * 2 + 1);
				else
					*((u_short *)tmp + i) = *((u_short *)data + i * 2);
			}
		}
	} else if (enc->audio_channel == 2){
		if ((enc->pcm_format == SND_PCM_FORMAT_A_LAW) ||
			(enc->pcm_format == SND_PCM_FORMAT_MU_LAW)) {
			printf("%s:%d MU_LAW and A_LAW only support mono\n", __FILE__, __LINE__);
			return -1;
		}
		tmp_cnt = chunk_bytes;
		memcpy(tmp, data, tmp_cnt);
	} else {
		tmp_cnt = chunk_bytes;
		memcpy(tmp, data, tmp_cnt);
	}

	size_t bfcount;
	switch (enc->pcm_format) {
	case SND_PCM_FORMAT_A_LAW:
		//bfcount = G711::ALawEncode(data, (s16 *)tmp, tmp_cnt);
		break;
	case SND_PCM_FORMAT_MU_LAW:
		//bfcount = G711::ULawEncode(data, (s16 *)tmp, tmp_cnt);
		break;
	case SND_PCM_FORMAT_S16_LE:
	case SND_PCM_FORMAT_U8:
		memcpy(data, tmp, tmp_cnt);
		bfcount = tmp_cnt;
		break;
	default:
		printf("Not supported format!\n");
		return -1;
	}

	return bfcount;
}

audio_aacenc_handle audio_aacenc_init()
{
	audio_aacenc_t *enc = (audio_aacenc_t *)malloc(sizeof(audio_aacenc_t));
	if(enc == NULL)
		return NULL;
	
	memset(enc, 0, sizeof(audio_aacenc_t));
	
	/* setup PCM */
	enc->pcm_format = SND_PCM_FORMAT_S16_LE;
	enc->audio_channel = 1;
	enc->sample_rate = 8000;

	int err = snd_pcm_open(&enc->pcm_handle, "default", SND_PCM_STREAM_CAPTURE, 0);
	if (err < 0) {
		printf("%s:%d pcm open error: %s", __FILE__, __LINE__, snd_strerror(err));
		goto fail;
	}

	enc->chunk_size = set_pcm_parameter(enc->pcm_handle, SND_PCM_STREAM_CAPTURE, enc);
	if(enc->chunk_size == 0) {
		goto fail;
	}
	
	/* setup AAC */
	enc->aaccfg.enc_mode = 0;
	enc->aaccfg.sample_freq = 8000;
	enc->aaccfg.coreSampleRate = 8000;
	enc->aaccfg.Src_numCh = 1;
	enc->aaccfg.Out_numCh = 1;
	enc->aaccfg.tns = 1;
	enc->aaccfg.ffType = 't';
	enc->aaccfg.bitRate = 8000;
	enc->aaccfg.quantizerQuality = 2;
	enc->aaccfg.codec_lib_mem_adr = (u32*)enc->mpTmpEncBuf;
	aacenc_setup(&enc->aaccfg);
	if (enc->aaccfg.ErrorStatus != ENCODE_OK) {
		printf("%s:%d aacenc_setup:ErrorStatus :%d\n", __FILE__, __LINE__, enc->aaccfg.ErrorStatus);
		goto fail;
	}

	aacenc_open(&enc->aaccfg);
	if (enc->aaccfg.ErrorStatus != ENCODE_OK) {
		printf("%s:%d aacenc_open:ErrorStatus :%d\n", __FILE__, __LINE__, enc->aaccfg.ErrorStatus);
		goto fail;
	}

	return enc;

fail:
	if(enc->pcm_handle)
		snd_pcm_close(enc->pcm_handle);
	snd_config_update_free_global();
	aacenc_close();
	free(enc);
	return NULL;
}

static void* aacEncodeThread(void *arg)
{
	audio_aacenc_t *enc = (audio_aacenc_t *)arg;
	size_t chunk_bytes = enc->chunk_size * enc->bits_per_frame / 8;

	u_char *buf_rx = (u_char *)malloc(chunk_bytes);
	u_char *buf_tmp = (u_char *)malloc(chunk_bytes);
	if (buf_tmp == NULL || buf_rx == NULL) {
		printf("%s:%d not enough memory\n", __FILE__, __LINE__);
		return NULL;
	}

	while(enc->abort == 0)
	{
		if(enc->pause)
		{
			usleep(100*1000);
			continue;
		}
	
		ssize_t c = chunk_bytes;
		size_t f = c * 8 / enc->bits_per_frame;
		
		if (pcm_read_raw(enc, enc->chunk_size, buf_rx, f) != f)
			continue;
		
		c = handle_data_copy(enc, enc->chunk_size, buf_rx, buf_tmp);
		if(c < 0)
			continue;

		enc->aaccfg.enc_rptr = (s32 *)buf_rx;
		enc->aaccfg.enc_wptr = enc->outputBuffer;
		aacenc_encode(&enc->aaccfg);
		if(enc->aaccfg.ErrorStatus != ENCODE_OK)
			continue;

		c = (enc->aaccfg.nBitsInRawDataBlock + 7) >> 3;
		if(enc->get_audio_frame)
			enc->get_audio_frame(enc->aaccfg.enc_wptr, c, enc->priv_data);

		enc->aaccfg.frameCounter ++;
	}

	printf("%s:%d %s exit\n", __FILE__, __LINE__, __func__);
	free(buf_tmp);
	free(buf_rx);
	return NULL;
}

int audio_aacenc_encode(audio_aacenc_handle handle, GetAudioFrame get_frame, void *user_data)
{
	audio_aacenc_t *enc = (audio_aacenc_t *)handle;
	enc->get_audio_frame = get_frame;
	enc->priv_data = user_data;
	enc->channel_id = 0;

	if(pthread_create(&enc->tid, NULL, aacEncodeThread, enc) != 0)
	{
		printf("%s:%d pthread create error\n", __FILE__, __LINE__);
		return -1;
	}

	return 0;
}

int audio_aacenc_pause(audio_aacenc_handle handle)
{
	audio_aacenc_t *enc = (audio_aacenc_t *)handle;
	enc->pause = 1;
	printf("%s:%d audio encode paused\n", __FILE__, __LINE__);
	return 0;
}

int audio_aacenc_resume(audio_aacenc_handle handle)
{
	audio_aacenc_t *enc = (audio_aacenc_t *)handle;
	enc->pause = 0;
	printf("%s:%d audio encode continued\n", __FILE__, __LINE__);
	return 0;
}

int audio_aacenc_deinit(audio_aacenc_handle handle)
{
	audio_aacenc_t *enc = (audio_aacenc_t *)handle;

	if(enc->tid)
	{
		enc->abort = 1;
		pthread_join(enc->tid, NULL);
	}
	if(enc->pcm_handle)
	{
		snd_pcm_close(enc->pcm_handle);
	}
	snd_config_update_free_global();
	aacenc_close();
	free(enc);
	
	return 0;
}

