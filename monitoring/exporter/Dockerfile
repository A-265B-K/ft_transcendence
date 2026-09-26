FROM python:3.13.15-alpine3.24
WORKDIR /app
COPY monitoring_exporter.py /app/

RUN pip install --no-cache-dir 'psycopg[binary]'

CMD [ "python", "-u", "/app/postgres_exporter.py" ]