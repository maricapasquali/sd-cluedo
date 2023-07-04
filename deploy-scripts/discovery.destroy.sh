#!/bin/bash

source ./deploy-scripts/variables.sh

while getopts ":c:" opt; do
  case $opt in
    c) discovery_container_name="$OPTARG"
    ;;
    \?) 
    echo "Usage: $(basename $0) [-c discovery container name]"
    exit 1
    ;;
  esac
done


# Remove discovery container
docker rm -f $(docker ps -a --filter name=$discovery_container_name -q)
