Compiled in Linux Kernel 3.10

1. 将librtmp.so放到/usr/lib下
2. chmod 777 librtmp.so
3. ln -s librtmp.so librtmp.so.0
4. chmod +x test
5. ./test 1 rtmp://192.168.2.3:1935/stream/test
	说明：第二个参数指定从哪个buffer取流，1表示buffer B，分辨率固定为640*480，码率为100K；
		第二个参数为RTMP服务器的地址。
