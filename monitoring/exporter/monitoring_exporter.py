import socket
import psycopg
import os
import signal
import requests

def shutdown(signum, frame):
    exit(0)

def connect_database():
    host = "postgres"
    port = 5432
    dbname = os.getenv("POSTGRES_DB")
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    return psycopg.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
    )

def fromDatabase(connection):
    with connect_database() as database:
        with database.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            playercount = cursor.fetchone()[0]
            return playercount


def toPrometheus(connection, playercount, backenddata):
    activerooms = int(backenddata["activerooms"])

    body = (
        f"registered_players {playercount}\n"
        f"activerooms {activerooms}\n"
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


def fromBackend():
    response = requests.get("http://backend:3000/stats", timeout=10)
    response.raise_for_status()
    return response.json()

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
            databasedata = fromDatabase(connection)
            backenddata = fromBackend()
            toPrometheus(connection, databasedata, backenddata)

if (__name__ == "__main__"):
    main()
