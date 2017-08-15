LIBS += -L./rtmp-lib/lib -lrtmp
LIBS += -L./aac/lib -laacenc
LIBS += -L./alsa-lib/usr/lib -lasound
LIBS += -L/home/luoguang/01.devel_common/fakeroot/usr/lib
LIBS += -Wl,-rpath=/home/luoguang/01.devel_common/fakeroot/lib
LIBS += -Wl,-rpath=/home/luoguang/01.devel_common/fakeroot/usr/lib
LIBS += -lpthread -lglib-2.0 -lgio-2.0 -lgobject-2.0 -lxcam-iface

CFLAGS += -I/home/luoguang/01.devel_common/fakeroot/usr/include/glib-2.0
CFLAGS += -I/home/luoguang/01.devel_common/fakeroot/usr/include
CFLAGS += -I/home/luoguang/01.devel_common/am_s2l/ambarella/include
CFLAGS += -I./alsautils
CFLAGS += -I./rtmp-lib/include
CFLAGS += -I./aac/include
CFLAGS += -I./alsa-lib/include
CFLAGS += -I./include
CFLAGS += -g -O0 -Wall -Wno-unused-but-set-variable

C = c
CPP = cpp
OBJ = o

CROSS = arm-linux-gnueabihf-
C_COMPILER = $(CROSS)gcc
CPLUSPLUS_COMPILER = $(CROSS)g++

LINK = $(CROSS)g++ -o
LINK_OBJ = main.o send_av.o am_bstream.o audio_aacenc.o video_h264.o dbus_if.o

APP = test_flv

.$(C).$(OBJ):
	$(C_COMPILER) -c $(CFLAGS) $<

.$(CPP).$(OBJ):
	$(CPLUSPLUS_COMPILER) -c $(CFLAGS) $<

$(APP): $(LINK_OBJ)
	$(LINK) $@  $(LINK_OBJ) $(LIBS)
	
clean:
	-rm -rf *.$(OBJ) $(APP) core *.core *~ include/*~

