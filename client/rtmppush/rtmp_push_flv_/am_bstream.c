#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <errno.h>

#include "iav_ioctl.h"
#include "am_bstream.h"

typedef struct _am_bs_obj {
    int      fd;
    int      id;
    uint8_t *addr;
    uint32_t size;
} am_bs_obj;

am_bs_handle am_bs_init(const char *iav_path, int id)
{
    struct iav_querybuf querybuf;
    struct iav_stream_info strm_info;
    uint32_t encode_streams = 1 << id;

    am_bs_obj *obj = (am_bs_obj *)calloc(sizeof(am_bs_obj), 1);

    if (!obj) return NULL;

    int fd = open(iav_path, O_RDWR, 0);

    if (fd <= 0) {
        goto labelError;    
    }

	querybuf.buf = IAV_BUFFER_BSB;
	if (ioctl(fd, IAV_IOC_QUERY_BUF, &querybuf) < 0) {
		perror("[am_bs] IAV_IOC_QUERY_BUF");
		goto labelError; 
    }

    querybuf.length *= 2;
	obj->addr = (uint8_t *)mmap(NULL, querybuf.length, PROT_READ|PROT_WRITE, MAP_SHARED, fd, querybuf.offset);
	if (obj->addr == MAP_FAILED) {
	    goto labelError;
    }

    // restart streaming
    strm_info.id = id;
    if (ioctl(fd, IAV_IOC_GET_STREAM_INFO, &strm_info) < 0) {
        perror("[am_bs] get stream info failed");
        goto labelError;
    }
    
    if (strm_info.state == IAV_STREAM_STATE_ENCODING) {
        if (ioctl(fd, IAV_IOC_STOP_ENCODE, encode_streams) < 0) {
            perror("[am_bs] IAV_IOC_STOP_ENCODE");
            goto labelError;
        }
    }

    if (ioctl(fd, IAV_IOC_START_ENCODE, encode_streams) < 0) {
        perror("[am_bs] IAV_IOC_START_ENCODE");
        goto labelError;
    }

    obj->fd   = fd;
    obj->id   = id;
    obj->size = querybuf.length;

    return obj;

labelError:
    if (obj) {
        if (obj->addr) {
            munmap(obj->addr, obj->size);
        }

        free(obj);
    }

    if (fd > 0) {
        close(fd);
    }

    return NULL;
}

int am_bs_get_one_frame(am_bs_handle h, am_bs_frame_info *info, int flags)
{
    int rc = 0;
    am_bs_obj *obj = (am_bs_obj *)h; 
    
    int fd = obj->fd;
    struct iav_querydesc   query_desc;
	struct iav_framedesc  *frame_desc;
    struct iav_stream_info stream_info;
    
    // query stream state
    stream_info.id = obj->id;
    rc = ioctl(fd, IAV_IOC_GET_STREAM_INFO, &stream_info);
    if ((rc < 0) || (stream_info.state != IAV_STREAM_STATE_ENCODING)){
        perror("IAV_IOC_GET_STREAM_INFO");
        return -1;
    }

    // query frame desc
    memset(&query_desc, 0, sizeof(struct iav_querydesc));
	query_desc.qid = IAV_DESC_FRAME;
    frame_desc = &query_desc.arg.frame;
	frame_desc->id = obj->id;
    frame_desc->time_ms = (flags & O_NONBLOCK) ? -1 : 0;
    rc = ioctl(fd, IAV_IOC_QUERY_DESC, &query_desc);

    if (rc >= 0) {
        memset(info, 0, sizeof(*info));
        info->ts = frame_desc->arm_pts;
        info->data_addr  = obj->addr + frame_desc->data_addr_offset;
        info->data_size  = frame_desc->size;
        info->i_frame    = (frame_desc->pic_type == IAV_PIC_TYPE_IDR_FRAME) || (frame_desc->pic_type == IAV_PIC_TYPE_I_FRAME);
        info->frame_num  = frame_desc->frame_num;
        info->stream_end = frame_desc->stream_end;
        info->session_id = frame_desc->session_id;
    }
    
    return rc;
}

int am_bs_deinit(am_bs_handle h)
{
    am_bs_obj *obj = (am_bs_obj *)h;
    
    if (!obj) return 0;

    // stop streaming
    do {
        uint32_t state, encode_streams = 0;
        struct iav_stream_info stream_info;

        if (!obj->fd) {
            break;
        }

        ioctl(obj->fd, IAV_IOC_GET_IAV_STATE, &state);
        if (state != IAV_STATE_ENCODING) {
            break;
        }

        stream_info.id = obj->id;
        ioctl(obj->fd, IAV_IOC_GET_STREAM_INFO, &stream_info);
        if (stream_info.state != IAV_STREAM_STATE_ENCODING) {
            break;
        }

        encode_streams = 1 << obj->id;
        ioctl(obj->fd, IAV_IOC_STOP_ENCODE, encode_streams);
    } while (0);

    if (obj->addr) {
        munmap(obj->addr, obj->size);
    }

    free(obj);

    return 0;
}

int am_bs_get_frame_size(am_bs_handle h, am_bs_size *size)
{
    int rc = -EINVAL;
    am_bs_obj *obj = (am_bs_obj *)h;
    struct iav_stream_format fmt;

    if (!obj || !obj->fd) return rc;

    fmt.id = obj->id;
    if (ioctl(obj->fd, IAV_IOC_GET_STREAM_FORMAT, &fmt) < 0) {
        perror("[am_bs] IAV_IOC_GET_STREAM_FORMAT");
        return -EBUSY;
    }

    size->width  = fmt.enc_win.width;
    size->height = fmt.enc_win.height;

    return 0;
}

