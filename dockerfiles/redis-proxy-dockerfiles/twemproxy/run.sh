#!/bin/sh

# Run docker run with -e ETCD_HOST=<ip>:<port>
if [ -n "${ETCD_HOST:+x}" ]; then
  mv /etc/supervisor/conf.d/twemproxy.conf /tmp/twemproxy.conf
  sed -e "/confd -node/s/127.0.0.1:4001/${ETCD_HOST}/" /tmp/twemproxy.conf > /etc/supervisor/conf.d/twemproxy.conf
fi

if [ -n "${PROCESS_ID:+x}" ]; then
  mv /etc/confd/conf.d/twemproxy.toml /tmp/twemproxy.toml
  sed "s/services/$PROCESS_ID/g" /tmp/twemproxy.toml > /etc/confd/conf.d/twemproxy.toml

  mv /etc/confd/templates/twemproxy.tmpl /tmp/twemproxy.tmpl
  sed "s/services/$PROCESS_ID/g" /tmp/twemproxy.tmpl > /etc/confd/templates/twemproxy.tmpl
fi

# /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
/root/bin/run.sh
