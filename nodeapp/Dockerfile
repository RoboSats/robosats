FROM node:18-bullseye-slim

RUN mkdir -p /usr/src/robosats
WORKDIR /usr/src/robosats

COPY . .
COPY ./nginx/local.conf /etc/nginx/conf.d/local.conf
RUN touch ./selfhosted

RUN apt-get update
RUN apt-get install -y socat nginx
RUN npm install http-server

EXPOSE 12596

CMD ["bash", "robosats-client.sh"]