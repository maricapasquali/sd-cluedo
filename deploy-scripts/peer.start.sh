#!/bin/bash

source ./deploy-scripts/network.create.sh

while getopts ":n:d:p:" opt; do
  case $opt in
    n) num_peer="$OPTARG"
    ;;
    d) discovery_address="$OPTARG"
    ;;
    p) port="$OPTARG"
    ;;
    \?)
    echo "Usage: $(basename $0) [-n number of peer to up] [-d https address discovery server] [-p host port first peer]"
    exit 1
    ;;
  esac
done

if [[ -z "$num_peer" ]]
then
  num_peer=1
fi

if [[ -n "$port" ]]
then
  peer_external_port=$port
fi

for k in $(seq 1 $num_peer);
do

    last_peer=$(docker ps --format '{{.Names}}' --filter name=cluedo-peer- | grep -m1 -oE "[^-]+$")
    i=$(($last_peer+1))

    hostname=$peer_hostname'-'$i
    container_name=$peer_container_name'-'$i
    echo 'Run container '$container_name' with hostname '$hostname' to port '$peer_external_port':'$peer_internal_port

    docker run --rm --name $container_name -d --network $network_name --hostname $hostname -p $peer_external_port:$peer_internal_port \
    -e DOCKER_BIND_HOSTNAME=$host_hostname -e DOCKER_BIND_PORT=$peer_external_port -e DISCOVERY_SERVER_ADDRESS=$discovery_address $peer_image_name

    ((peer_external_port+=1))
done
