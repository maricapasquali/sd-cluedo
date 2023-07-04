#!/bin/bash

source ./deploy-scripts/variables.sh

while getopts ":n:d:p:" opt; do
  case $opt in
    n) num_peer="$OPTARG"
    ;;
    d) discovery_external_port="$OPTARG"
       setDiscoveryAddress
    ;;
    p) peer_external_port="$OPTARG"
    ;;
    \?) 
    echo "Usage: $(basename $0) [-n number of peer to up] [-d host port discovery server] [-p host port first peer]"
    exit 1
    ;;
  esac
done

./deploy-scripts/all.destroy.sh

./deploy-scripts/all.build.sh

./deploy-scripts/discovery.start.sh -p $discovery_external_port

./deploy-scripts/peer.start.sh -p $peer_external_port -d $discovery_address -n $num_peer
