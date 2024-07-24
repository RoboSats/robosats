FROM dockurr/strfry:0.9.6

RUN apk add --no-cache torsocks

RUN echo "TorAddress 127.0.0.1" >> /etc/tor/torsocks.conf
RUN echo "TorPort 9050" >> /etc/tor/torsocks.conf

# Setting up crontab
COPY crontab /tmp/crontab
RUN cat /tmp/crontab > /etc/crontabs/root

COPY sync.sh /etc/strfry/sync.sh
COPY entrypoint.sh /etc/strfry/entrypoint.sh

RUN chmod +x /etc/strfry/entrypoint.sh

ENTRYPOINT ["/etc/strfry/entrypoint.sh"]
