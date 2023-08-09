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
-e DOCKER_BIND_HOSTNAME=$host_hostname -e DOCKER_BIND_PORT=$discovery_external_port -p $discovery_external_port:$discovery_internal_port $discovery_image_name

