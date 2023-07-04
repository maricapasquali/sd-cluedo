#!/bin/bash

echo 'Start Peer'

mongod --fork --logpath /var/log/mongodb.log && npm start -w peer
