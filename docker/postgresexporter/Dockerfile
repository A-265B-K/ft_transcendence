FROM python
WORKDIR /app

RUN  pip install 'psycopg[binary]'
COPY postgres_exporter.py /app/


CMD [ "python", "-u", "/app/postgres_exporter.py" ]
       