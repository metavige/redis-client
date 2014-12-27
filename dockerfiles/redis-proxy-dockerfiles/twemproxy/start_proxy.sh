#!/bin/bash

PUBLIC_IP=$(/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}')
TWEMPROXY_PORT=6000
TWEMPROXY_STATS_PORT=6222
ETCD_HOST=$PUBLIC_IP:4001
# ETCD_HOST=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' etcd):5001

#etcdctl set /services/twemproxy/port $TWEMPROXY_PORT
# Call ETCD, to setting up TWEMPROXY_PORT
curl -L $ETCD_HOST/v2/keys/$1/twemproxy/port -XPUT -d value=$TWEMPROXY_PORT
# docker rm -f redis-twemproxy

docker run -d -p 2222:22 -p $TWEMPROXY_PORT:6000 -p $TWEMPROXY_STATS_PORT:6222 -e ETCD_HOST=$ETCD_HOST -e PROCESS_ID=$1 nebula/redis-twemproxy
# etcdctl set /services/twemproxy/host 127.0.0.1
curl -L $ETCD_HOST/v2/keys/$1/twemproxy/host -XPUT -d value=$PUBLIC_IP

