FROM python:3.13.15-alpine3.24
WORKDIR /app

RUN pip install --no-cache-dir 'psycopg[binary]'
RUN pip install --no-cache-dir 'requests'

COPY monitoring_exporter.py /app/
CMD [ "python", "-u", "/app/monitoring_exporter.py" ]