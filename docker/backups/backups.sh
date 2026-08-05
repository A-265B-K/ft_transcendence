#!/bin/sh
set -e 
while true ; do 
    echo "backup in progress"
    archive=$(date "+Backup-%Y-%m-%d-%H-%M").tar.gz

    mkdir -p tmp
    cd tmp

    pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" > postgres.sql


    tar -czvf "$archive" tmp
    rm -rf "$folder" tmp
    mv "$archive" ./backups

    cd ../backups 
    ls | sort | head -n -10 | xargs -r rm 
    cd ../ 

    sleep 300
done