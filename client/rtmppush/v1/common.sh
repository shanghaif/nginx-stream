#!/bin/sh

export PATH="/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/bin"

CPU_FREQ_MAX=816000
CPU_FREQ_MIN=24000
CPU_FREQ_PATH=/sys/devices/system/cpu/cpu0/cpufreq
USR_PROC_LIST="rtsp mp4rec dfss vcom-fcw gpsd idsp-tuning"
VOUT_HDMI=0
VIN_FPS=20
CVBS_RES=576

P_LCK_PIN=25
W_RST_PIN=-1
G_PWR_PIN=-1
A_PWR_PIN=9

# toggle_gpio
#   param1: gpio pin
#   param2: gpio state, 0 - off, 1 - on
toggle_gpio()
{
    if [ ${1} -lt 0 ]; then
        return
    fi

    if [ ! -d /sys/class/gpio/gpio${1} ]; then
        echo ${1} > /sys/class/gpio/export
        echo "out" > /sys/class/gpio/gpio${1}/direction
    fi

    echo ${2} > /sys/class/gpio/gpio${1}/value
}

switch_led()
{
    echo none > /sys/class/leds/${1}/trigger
    echo ${2} > /sys/class/leds/${1}/brightness
}

blink_led()
{
    if [ $# -lt 1 ] || [ ! -d /sys/class/leds/${1} ]; then
        return
    fi

    echo timer > /sys/class/leds/${1}/trigger
    if [ $# -eq 3 ]; then
        echo $2 > /sys/class/leds/${1}/delay_on
        echo $3 > /sys/class/leds/${1}/delay_off
    fi
}

# setup_video
#   param1: mode, 0 - normal, 1 - fast
setup_video()
{
    X_OPTS="--bmaxsize 720p --bsize 720p --binsize 720p"
    Y_OPTS="--bsize 640x480 --binsize 960x720 --binoffset 160x0"
    S_OPTS="-i 0 --enc-mode 4 --debug-iso-type 2"

    if [ ${VOUT_HDMI} -eq 0 ]; then
        VOUT_OPTS="${CVBS_RES}i --cvbs --fb 0"
        fbset -g 720 ${CVBS_RES} 720 $(expr ${CVBS_RES} \* 2) 8
    else
        VOUT_OPTS="720p --hdmi --fb 0"
        fbset -g 720 480 720 960 8
    fi

    if [ $1 -eq 0 ]; then
        idsp-encode ${S_OPTS} -f ${VIN_FPS} -X ${X_OPTS} -Y ${Y_OPTS} -V ${VOUT_OPTS}
    else
        idsp-encode ${S_OPTS} -f ${VIN_FPS} -X ${X_OPTS}
    fi
}

setup_encode()
{
    B_FACTOR=1
    A_OPTS="-h 720p -b 0 -N ${VIN_FPS} --profile 1 --bitrate 5000000 --au-type 0"
    B_OPTS="-h 640x480 -b 1 -N $(expr ${VIN_FPS} / ${B_FACTOR}) --profile 1 --frame-factor 1/${B_FACTOR} --bitrate 100000 --au-type 0"
    C_OPTS="-h 640x480 -b 1 -N $(expr ${VIN_FPS} / ${B_FACTOR}) --profile 1 --frame-factor 1/${B_FACTOR} --bitrate 500000 --au-type 0"

    if [ $1 -eq 0 ]; then
        idsp-encode -A ${A_OPTS} -B ${B_OPTS} -C ${C_OPTS}
    else
        idsp-encode -A ${A_OPTS}
    fi
}

play_audio() 
{
    dbus-send --system --type=method_call --print-reply --dest=com.xcam.aplayd /com/xcam/aplayd com.xcam.aplayd.play string:$1
}

set_volume_level()
{                                                 
    level=${1}
    if [ ${level} -lt 0 ]; then
        level=0
    fi
                    
    if [ ${level} -gt 5 ]; then
        level=5
    fi
                                              
    if [ ${level} -eq 0 ]; then
        VALUE=0
    else
        VALUE=`expr ${level} \* 18 + 165`
    fi
    amixer cset numid=4,iface=MIXER,name='Digital Output Volume' ${VALUE} > /dev/null
    amixer cset numid=3,iface=MIXER,name='Speaker Output Volume' 1 > /dev/null
}
