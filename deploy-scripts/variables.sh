#!/bin/bash

function setDiscoveryAddress() {
	discovery_address=https://$discovery_hostname:$discovery_external_port
}

prefix_image=cluedo/

network_name=sd-cluedo-network

discovery_image_name=$prefix_image'discovery'
discovery_container_name=cluedo-discovery
discovery_hostname=discovery
discovery_external_port=3000
discovery_internal_port=3000
setDiscoveryAddress

peer_image_name=$prefix_image'peer'
peer_container_name=cluedo-peer
peer_hostname=peer
peer_external_port=3001
peer_internal_port=3001
