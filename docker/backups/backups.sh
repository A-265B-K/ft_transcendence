#!/bin/sh

while true ; do 
    echo "backup in progress"
    folder=$(date "+Backup-%D-%H:%M")
    archive=${folder}.tar.gz

    mkdir "$(folder)" tmp
    tar -czvf "$(archive)" "$(folder)"
    rm -rf "$(folder)"
    mv "$(archive)" backups
    
    sleep 600
done