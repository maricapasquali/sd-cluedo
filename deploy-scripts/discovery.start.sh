#!/bin/bash

source ./deploy-scripts/network.create.sh

while getopts ":p:" opt; do
  case $opt in
    p) port="$OPTARG"
    ;;
    \?) 
    echo "Usage: $(basename $0) [-p host port discovery server]"
    exit 1
    ;;
  esac
done

if [[ -n "$port" ]] 
then 
  discovery_external_port=$port
fi

# Run a new discovery container
docker run --rm --name $discovery_container_name -d \
--network $network_name --hostname $discovery_hostname \
-p $discovery_external_port:$discovery_internal_port -e EXTERNAL_PORT=$discovery_external_port $discovery_image_name

