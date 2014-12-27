FROM redis

ADD reconfigure.sh /usr/local/bin/reconfigure
RUN chmod +x /usr/local/bin/reconfigure

ADD sentinel.conf /etc/redis/sentinel.conf
CMD ["redis-sentinel", "/etc/redis/sentinel.conf"]

EXPOSE 26379
