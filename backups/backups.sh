#!/bin/sh
set -e 

shutdown()
{
    exit 0 ;
}

trap shutdown TERM INT
while true ; do 
    echo "backup in progress"
    archive=$(date "+Backup-%Y-%m-%d-%H-%M").tar.gz
    mkdir -p tmp


    cd tmp
    pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" > postgres.sql

    
    cd ../
    tar -czvf "backups/$archive" tmp/*
    rm -rf tmp
    
    cd backups 
    ls | sort | head -n -10 | xargs -r rm 
    cd ../ 
    
    for _ in $(seq 1 100); do
        sleep 3
    done
done