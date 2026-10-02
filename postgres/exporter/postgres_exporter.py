import socket
import psycopg
import os
import signal
import requests
from pathlib import Path

def shutdown(signum, frame):
    exit(0)

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://vault:8200")
VAULT_TOKEN_FILE = os.getenv(
    "VAULT_TOKEN_FILE",
    "/run/secrets/exporter_vault_token",
)

def get_postgres_credentials():
    try:
        vault_token = Path(VAULT_TOKEN_FILE).read_text().strip()
    except OSError as error:
        raise RuntimeError(
            f"Unable to read Vault token file: {VAULT_TOKEN_FILE}"
        ) from error

    response = requests.get(
        f"{VAULT_ADDR}/v1/app/data/postgres-app",
        headers={
            "X-Vault-Token": vault_token,
        },
        timeout=5,
    )

    if not response.ok:
        raise RuntimeError(
            f"Vault request failed: "
            f"{response.status_code} {response.reason}"
        )

    body = response.json()

    credentials = body.get("data", {}).get("data")

    if not credentials:
        raise RuntimeError("Vault returned no PostgreSQL credentials")

    username = credentials.get("username")
    password = credentials.get("password")
    database = credentials.get("database")

    if not username or not password or not database:
        raise RuntimeError(
            "Vault PostgreSQL credentials are incomplete"
        )

    return username, password, database


def connect_database():
    username, password, database = get_postgres_credentials()

    return psycopg.connect(
        host="postgres",
        port=5432,
        dbname=database,
        user=username,
        password=password,
    )

def getfromdatabase(connection):
    with connect_database() as database:
        with database.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            playercount = cursor.fetchone()[0]
    body = (
        f"registered_players {playercount}\n"
    )

    response = (
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/plain; version=0.0.4; charset=utf-8\r\n"
        f"Content-Length: {len(body.encode('utf-8'))}\r\n"
        "Connection: close\r\n"
        "\r\n"
        f"{body}"
    )
    connection.sendall(response.encode("utf-8"))


def main():
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    port = 80
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", port))
    server.listen()
    server.settimeout(1)
    print(f"Listening on port {port}")
    while (True):
        try:
            connection, address = server.accept()
        except socket.timeout:
            continue
        with connection:
            getfromdatabase(connection)

if (__name__ == "__main__"):
    main()