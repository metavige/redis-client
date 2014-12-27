#!/bin/sh

PUBLIC_IP=$(/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}')
ETCD_HOST=$PUBLIC_IP:4001

docker run -d -p 6380:26379 -e ETCD_HOST=$ETCD_HOST --name sentinel nebula/redis-sentinel
