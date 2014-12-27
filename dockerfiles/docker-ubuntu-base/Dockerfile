#
# NEBULA supervisord
#
# https://github.com/metavige/docker-ubuntu-base
#

# Base image.
FROM ubuntu:14.04

MAINTAINER "metavige <metavige@gmail.com>"

ENV DEBIAN_FRONTEND noninteractive

# Install Packages.
RUN apt-get update -y && \
    apt-get -qy install openssh-server ca-certificates pwgen && \
    apt-get -qy install supervisor python-pip git tar vim && \
    apt-get -qy install byobu curl htop man unzip wget && \
    apt-get clean --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#https://github.com/docker/docker/issues/6103
RUN mkdir -p /var/run/sshd && \
    sed -i "s/UsePrivilegeSeparation.*/UsePrivilegeSeparation no/g" /etc/ssh/sshd_config && \
    sed -i "s/PermitRootLogin.*/PermitRootLogin yes/g" /etc/ssh/sshd_config && \
    sed -ri 's/UsePAM yes/UsePAM no/g' /etc/ssh/sshd_config

# Better logging of services in supervisor
RUN pip install --quiet supervisor-stdout

# For Store Root Password
VOLUME /data/persistant

RUN mkdir /root/bin
ADD set_root_pw.sh /root/bin/set_root_pw.sh
ADD run.sh /root/bin/run.sh

RUN chmod a+x /root/bin/*.sh

ADD supervisord.conf /etc/supervisor/supervisord.conf
# Add sshd to supervisor
ADD sshd.conf /etc/supervisor/conf.d/sshd.conf

# Add files. for bash and git config
ADD root/.bashrc /root/.bashrc
ADD root/.gitconfig /root/.gitconfig
ADD root/.scripts /root/.scripts

# Set environment variables.
ENV HOME /root
# Define working directory.
WORKDIR /root
# for bash inspect
EXPOSE 22

CMD ["/root/bin/run.sh"]

