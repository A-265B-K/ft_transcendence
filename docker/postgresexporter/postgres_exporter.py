import socket
import psycopg
import os
import signal

def shutdown():
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
    server.timeout(1)
    print(f"Listening on port {port}")
    while (True):
        try:
            connection, address = server.accept()
        except socket.timeout:
            continue
        with connection:
            print("exporting from database")
            getfromdatabase(connection)

if (__name__ == "__main__"):
    main()