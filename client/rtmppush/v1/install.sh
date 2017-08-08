
cp librtmp.so /usr/lib
chmod 777 /usr/lib/librtmp.so
ln -s /usr/lib/librtmp.so /usr/lib/librtmp.so.0

cp common.sh /usr/local/bin
chmod 755 /usr/local/bin/common.sh

chmod +x test
