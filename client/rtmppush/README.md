Compiled in Linux Kernel 3.10

1. ��librtmp.so�ŵ�/usr/lib��
2. chmod 777 librtmp.so
3. ln -s librtmp.so librtmp.so.0
4. chmod +x test
5. ./test 1 rtmp://192.168.2.3:1935/stream/test
	˵�����ڶ�������ָ�����ĸ�bufferȡ����1��ʾbuffer B���ֱ��ʹ̶�Ϊ640*480������Ϊ100K��
		�ڶ�������ΪRTMP�������ĵ�ַ��
