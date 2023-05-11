FROM alpine:3.18.0

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

COPY . .
COPY ./nginx.conf /etc/nginx/nginx.conf

RUN apk -U --no-cache upgrade \
    && apk --no-cache add socat \
    && apk --no-cache add nginx

EXPOSE 12596
HEALTHCHECK CMD curl --fail http://localhost:12596/selfhosted || exit 1

CMD ["sh", "robosats-client.sh"]