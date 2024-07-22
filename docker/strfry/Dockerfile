FROM dockurr/strfry:0.9.6

RUN apk add --no-cache dcron torsocks

RUN echo "TorAddress 127.0.0.1" >> /etc/tor/torsocks.conf
RUN echo "TorPort 9050" >> /etc/tor/torsocks.conf

ADD . /app

COPY entrypoint.sh /etc/strfry/entrypoint.sh

RUN chmod +x /etc/strfry/entrypoint.sh

ENTRYPOINT ["/etc/strfry/entrypoint.sh"]
