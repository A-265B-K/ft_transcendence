FROM python:3.11.15-slim-trixie
WORKDIR /app
COPY postgres_exporter.py /app/

RUN  pip install 'psycopg[binary]'

CMD [ "python", "-u", "/app/postgres_exporter.py" ]
       