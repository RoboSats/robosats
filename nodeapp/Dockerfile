FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

COPY . .

RUN npm install http-server

EXPOSE 12596

CMD http-server . -p 12596 -P http://127.0.0.1:81 & nohup socat tcp4-LISTEN:81,reuseaddr,fork,keepalive,bind=127.0.0.1 SOCKS4A:${TOR_PROXY_IP:-127.0.0.1}:${ROBOSATS_ONION:-http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion}:80,socksport=${TOR_PROXY_PORT:-9050}