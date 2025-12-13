FROM alpine:3.23

LABEL maintainer="Reckless_Satoshi https://github.com/reckless-satoshi"

# Needs a copy or symlink of /frontend/static in /nodeapp/static
# Github client release workflow copies /frontend/static here

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

RUN set -x \
    && addgroup -g 101 -S nginx \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

COPY . .
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./coordinators/ /etc/nginx/conf.d/

RUN apk -U --no-cache upgrade \
    && apk --no-cache add socat \
    && apk --no-cache add nginx

EXPOSE 12596
HEALTHCHECK CMD curl --fail http://localhost:12596/selfhosted || exit 1

CMD ["sh", "robosats-client.sh"]