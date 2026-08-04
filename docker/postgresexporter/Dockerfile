FROM python:3.13.14-trixie
WORKDIR /app

RUN  pip install 'psycopg[binary]'

CMD [ "python", "-u", "/app/postgres_exporter.py" ]
       