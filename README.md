# Nginx Stream

## Build nginx with nginx-rtmp

    sudo ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module
    sudo make
    sudo make install

## Start nginx Server

    sudo /usr/local/nginx/sbin/nginx


## 推流指令
    
    ffmpeg -f video4linux2 -i /dev/video0 -c:v libx264 -an -f flv rtmp://localhost/myapp/mystream #Linux

    ffmpeg -f avfoundation -framerate 30 -i "0" -c:v libx264 -an -f flv rtmp://localhost/myapp/mystream #MacOS

    c:\> ffmpeg -list_devices true -f dshow -i dummy
    
    ffmpeg -f dshow -i video="Microsoft Camera Front" -b:v 128k -c:v libx264 -an -f flv rtmp://116.62.61.121:50071/hls/device #Windows


## 播放器拉流

可参考[clappr.io](https://github.com/clappr/clappr.git)

## 降延迟的方案

https://stackoverflow.com/questions/24038308/reduce-hls-latency-from-30-seconds
http://phoboslab.org/log/2013/09/html5-live-video-streaming-via-websockets
