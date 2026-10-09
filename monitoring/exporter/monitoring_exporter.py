import os
import signal
import socket
from pathlib import Path

import psycopg
import requests


def shutdown(signum, frame):
    raise SystemExit(0)


VAULT_ADDR = os.getenv("VAULT_ADDR", "http://vault:8200")
VAULT_TOKEN_FILE = os.getenv(
    "EXPORTER_VAULT_TOKEN_FILE",
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
        f"{VAULT_ADDR}/v1/app/data/postgres_exporter",
        headers={"X-Vault-Token": vault_token},
        timeout=5,
    )
    response.raise_for_status()

    credentials = response.json().get("data", {}).get("data")
    if not credentials:
        raise RuntimeError("Vault returned no PostgreSQL credentials")

    username = credentials.get("username")
    password = credentials.get("password")
    database = credentials.get("database")
    if not username or not password or not database:
        raise RuntimeError("Vault PostgreSQL credentials are incomplete")

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


def from_database():
    with connect_database() as database:
        with database.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            return cursor.fetchone()[0]


def from_backend():
    response = requests.get("http://backend:3000/stats", timeout=10)
    response.raise_for_status()
    return response.json()


def to_prometheus(connection, player_count, backend_data):
    active_rooms = int(backend_data["activeRooms"])
    body = (
        f"registered_players {player_count}\n"
        f"activerooms {active_rooms}\n"
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

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", 80))
    server.listen()
    server.settimeout(1)
    print("Listening on port 80")
    while True:
        try:
            connection, address = server.accept()
        except socket.timeout:
            continue
        with connection:
            to_prometheus(connection, from_database(), from_backend())


if __name__ == "__main__":
    main()
