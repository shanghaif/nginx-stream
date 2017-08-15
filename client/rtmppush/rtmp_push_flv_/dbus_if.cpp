#include "xcam_iface.h"
#include "dbus_if.h"
#include "send_av.h"

XCamRtmp_client *  Rtmp_client = NULL;
static GMainLoop* g__main_loop = NULL;
RTMPConnect *g_conn = NULL; /* XXX */

static
gboolean
on_handle_open_stream(
	XCamRtmp_client *object,
	GDBusMethodInvocation *invocation,
	const gchar *url,
	gpointer user_data)
{
	gboolean ret;
	
	g_conn = rtmp_client_init();
	if(g_conn == NULL)
	{
		ret = FALSE;
		goto fail;
	}

	if(rtmp_client_connect(g_conn, (char *)url) < 0)
	{
		rtmp_client_deinit(g_conn);
		g_conn = NULL;
		ret = FALSE;
		goto fail;
	}

	if(rtmp_client_publish(g_conn) < 0)
	{
		rtmp_client_disconnect(g_conn);
		rtmp_client_deinit(g_conn);
		g_conn = NULL;
		ret = FALSE;
		goto fail;
	}

	ret = TRUE;

fail:
	xcam_rtmp_client_complete_open_stream(object, invocation, ret);
	return TRUE;
}

static
gboolean 
on_handle_close_stream(
	XCamRtmp_client *object,
	GDBusMethodInvocation *invocation,
	gpointer user_data)
{	
	rtmp_client_disconnect(g_conn);
	rtmp_client_deinit(g_conn);

	xcam_rtmp_client_complete_open_stream(object, invocation, TRUE);
	return TRUE;
}

static void on_name_acquired (GDBusConnection* connection, const gchar* name, gpointer user_data)
{
	g_print ("Acquired the name %s\n", name);

	if (!g_dbus_interface_skeleton_export (G_DBUS_INTERFACE_SKELETON (Rtmp_client),
		connection,
		"/com/xcam/rtmp_client",
		NULL))
	{
		/* handle error */
		g_print("export skeleton error.\n");
	}

	// connect method 
	g_signal_connect(Rtmp_client,  "handle-open-stream" , G_CALLBACK (on_handle_open_stream),  NULL);
	g_signal_connect(Rtmp_client,  "handle-close-stream" , G_CALLBACK (on_handle_close_stream),  NULL);
}

static void on_name_lost (GDBusConnection* connection,const gchar* name,gpointer user_data)
{
	g_print ("Lost the name %s\n", name);
}

static void on_bus_acquired (GDBusConnection* connection,const gchar* name,gpointer user_data)
{
	g_print ("Acquired a message bus connection:%s\n",name);
}

void rtmp_client_service_run()
{
	Rtmp_client = xcam_rtmp_client_skeleton_new();

	g__main_loop = g_main_loop_new(NULL, FALSE);

	g_bus_own_name(G_BUS_TYPE_SYSTEM,
		"com.xcam.rtmp_client",
		G_BUS_NAME_OWNER_FLAGS_NONE,
		on_bus_acquired,
		on_name_acquired,
		on_name_lost,
		&Rtmp_client,
		NULL);

	g_main_loop_run (g__main_loop);
}

void rtmp_client_service_stop()
{
	if(g__main_loop) 
	{
		g_main_loop_quit(g__main_loop);
	}
}

