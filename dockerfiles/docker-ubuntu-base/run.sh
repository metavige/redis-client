#!/bin/bash
if [ ! -f /data/persistent/.root_pw_set ]; then
	/root/bin/set_root_pw.sh
fi

exec supervisord -n -c /etc/supervisor/supervisord.conf
