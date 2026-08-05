#!/bin/sh
set -e 
while true ; do 
    echo "backup in progress"
    folder=$(date "+Backup-%Y-%m-%d-%H-%M")
    archive=${folder}.tar.gz

    mkdir -p "$folder" tmp
    tar -czvf "$archive" "$folder"
    rm -rf "$folder" tmp
    mv "$archive" ./backups


    cd backups 
    ls | sort | head -n -2 | xargs -r rm 
    cd ../ 

    sleep 60
done