#
# nebula twemproxy
#
# https://github.com/metavige/redis-proxy/dockerfiles/twemproxy
#

# Base image.
FROM nebula/supervisord

MAINTAINER "metavige <metavige@gmail.com>"

ENV DEBIAN_FRONTEND noninteractive

# apt-get
RUN echo 'Acquire::http { Proxy "http://192.168.0.103:3142"; };' > /etc/apt/apt.conf.d/20proxy && \
    sed -i 's/archive.ubuntu.com/free.nchc.org.tw/g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install build-essential libtool autoconf automake -y && \
    apt-get clean --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install confd
RUN curl -x http://192.168.0.107:6588 -qL https://github.com/kelseyhightower/confd/releases/download/v0.6.3/confd-0.6.3-linux-amd64 -o /tmp/confd && \
    mv /tmp/confd /usr/local/bin/confd && \
    chmod +x /usr/local/bin/confd && \
    mkdir -p /etc/confd/conf.d && \
    mkdir -p /etc/confd/templates

# Install twemproxy
# RUN curl -x http://192.168.0.107:6588 -qL https://github.com/twitter/twemproxy/archive/v0.4.0.tar.gz | tar xzf -
RUN export https_proxy="http://192.168.0.107:6588" && \
    git clone https://github.com/twitter/twemproxy
RUN cd twemproxy && \
    autoreconf -fvi && \
    ./configure --enable-debug=full && \
    make && \
    mv src/nutcracker /twemproxy && \
    cd /root && rm -rf twemproxy

# Set up run script
ADD run.sh /root/bin/twemproxy-run.sh
RUN chmod 755 /root/bin/twemproxy-run.sh

# Copy confd files
ADD confd/conf.d/twemproxy.toml /etc/confd/conf.d/twemproxy.toml
ADD confd/templates/twemproxy.tmpl /etc/confd/templates/twemproxy.tmpl

# Copy supervisord files
ADD supervisord.conf /etc/supervisor/conf.d/twemproxy.conf

EXPOSE 22 6000 6222

CMD ["/root/bin/twemproxy-run.sh"]
