FROM alpine:3

RUN apk --no-cache --no-progress add tor=~0.4

EXPOSE 9001 9050

# hadolint ignore=DL3002
USER root
ARG LOCAL_USER_ID=9999
ENV TOR_DATA=/var/lib/tor

# Add useradd and usermod
# Create user account (UID will be changed in entrypoint script)
RUN apk --no-cache --no-progress add shadow=~4 sudo=~1 && \
  useradd -u $LOCAL_USER_ID --shell /bin/sh -m alice && \
  usermod -g alice tor

COPY entrypoint.sh /root/entrypoint.sh
COPY torrc /tmp/torrc

ENTRYPOINT [ "/root/entrypoint.sh" ]
