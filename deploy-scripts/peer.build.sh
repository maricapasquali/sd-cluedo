#!/bin/bash

source ./deploy-scripts/variables.sh

# Build image of peer
docker image build . --tag $peer_image_name --target peer --no-cache
