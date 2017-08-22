#ifndef __AM_BSTREAM_H__
#define __AM_BSTREAM_H__

#include <stdint.h>

#define AM_BS_TIMESCALE     (90000) 

typedef struct _am_bs_frame_info {
    uint64_t  ts;
    uint32_t  i_frame;
    uint8_t  *data_addr;
    uint32_t  data_size;
    uint32_t  frame_num;
    uint32_t  session_id;
    uint32_t  stream_end;
} am_bs_frame_info;

typedef struct _am_bs_size {
    uint32_t width;
    uint32_t height;
} am_bs_size;

typedef void * am_bs_handle;

#ifdef __cplusplus
extern "C" {
#endif

extern am_bs_handle am_bs_init(const char *iav_path, int id);
extern int am_bs_get_one_frame(am_bs_handle h, am_bs_frame_info *info, int flags);
extern int am_bs_get_frame_size(am_bs_handle h, am_bs_size *size);
extern int am_bs_deinit(am_bs_handle h);

#ifdef __cplusplus
}
#endif

#endif
