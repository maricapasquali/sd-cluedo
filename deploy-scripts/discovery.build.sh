#!/bin/bash

source ./deploy-scripts/variables.sh

# Build image of discovery server
docker image build . --tag $discovery_image_name --target discovery --no-cache

