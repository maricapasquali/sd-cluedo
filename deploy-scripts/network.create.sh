#!/bin/bash

source ./deploy-scripts/variables.sh

docker network create --attachable -d bridge $network_name
