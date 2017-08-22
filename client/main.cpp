#include <stdio.h>
#include <unistd.h>
#include "send_av.h"
#include "dbus_if.h"

int main(int argc, char* argv[])
{
#if 1
	printf("Usage: ./test_flv rtmp://192.168.2.3:1935/live/test\n\n");

	RTMPConnect *c = rtmp_client_init(11025, 16000, 1);
	
	rtmp_client_connect(c, argv[1]);
	
	printf("%s:%d connect RTMP server successfully\n", __FILE__, __LINE__);
	
	rtmp_client_publish(c);

	while(1)
		sleep(60);

	rtmp_client_disconnect(c);
	
	rtmp_client_deinit(c);
#else
	rtmp_client_service_run();
#endif

	return 0;
}

