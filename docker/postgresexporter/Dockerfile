FROM python:3.11.15-slim-trixie
WORKDIR /app

RUN  pip install 'psycopg[binary]'
COPY postgres_exporter.py /app/


CMD [ "python", "-u", "/app/postgres_exporter.py" ]
       