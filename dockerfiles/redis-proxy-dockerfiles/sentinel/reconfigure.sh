#!/bin/sh
# <master-name> <role> <state> <from-ip> <from-port> <to-ip> <to-port>
export PATH=/sbin:/usr/local/bin:$PATH
MASTER_NAME=$1
ROLE=$2
STATE=$3
FROM_IP=$4
FROM_PORT=$5
TO_IP=$6
TO_PORT=$7

echo "Reconfigure MASTER: $MASTER_NAME to $TO_IP:$TO_PORT"

# 如果有七個參數，才做以下的動作，表示真的有變更 master
if [ "$#" = "7" ]; then
	# 透過變更 ETCD 的資料來觸發 confd/twemproxy restart
	curl -L "$ETCD_HOST/v2/keys/$MASTER_NAME/redis/A" -XPUT -d "value=$TO_IP:$TO_PORT"
fi
