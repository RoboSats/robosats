FROM lightninglabs/lnd:v0.15.0-beta

ARG LOCAL_USER_ID=9999
ARG LOCAL_GROUP_ID=9999

USER root

RUN adduser --disabled-password lnd
# Set the expected local user id
# for shared group to access tor cookie
RUN apk --no-cache --no-progress add shadow=~4 sudo=~1 gettext=~0.21 && \
    usermod -u "$LOCAL_USER_ID" lnd && \
    groupmod -g "$LOCAL_GROUP_ID" lnd

USER root
COPY entrypoint.sh /root/entrypoint.sh
COPY lnd.conf /tmp/lnd.conf

ENTRYPOINT [ "/root/entrypoint.sh" ]
