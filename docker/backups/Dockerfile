FROM debian

WORKDIR /app
COPY backups.sh /app

RUN apt-get update
RUN apt-get install -y postgresql-common ca-certificates curl
RUN /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
RUN apt-get install -y postgresql-client-18

CMD ["./backups.sh"]
