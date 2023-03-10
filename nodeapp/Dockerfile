FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

COPY . .
COPY ./nginx/local.conf /etc/nginx/conf.d/local.conf
RUN touch ./selfhosted

RUN apt-get update
RUN apt-get install -y socat nginx curl
RUN npm install http-server

EXPOSE 12596
HEALTHCHECK CMD curl --fail http://localhost:12596/selfhosted || exit 1

CMD ["bash", "robosats-client.sh"]