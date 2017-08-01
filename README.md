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

## 播放器拉流

可参考[clappr.io](https://github.com/clappr/clappr.git)