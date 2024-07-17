FROM dockurr/strfry:0.9.6

USER root

RUN apk add --no-cache dcron

RUN crontab -u root /etc/crontab

ENTRYPOINT ["/etc/entrypoint.sh"]

CMD ["$@"]