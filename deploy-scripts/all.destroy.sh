#!/bin/bash

source ./deploy-scripts/variables.sh

# Remove peers containers
./deploy-scripts/peer.destroy.sh

# Remove discovery container
./deploy-scripts/discovery.destroy.sh

# Remove network
docker network rm $network_name

# Remove images
docker rmi $(docker images $prefix_image* -q)
