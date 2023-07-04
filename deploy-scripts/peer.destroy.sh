#!/bin/bash

source ./deploy-scripts/variables.sh

while getopts ":c:" opt; do
  case $opt in
    c) peer_container_name="$OPTARG"
    ;;
    \?) 
    echo "Usage: $(basename $0) [-c peer container name]"
    exit 1
    ;;
  esac
done


# Remove peers containers
docker rm -f $(docker ps -a --filter name="$peer_container_name" -q)
