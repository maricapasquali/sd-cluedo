/**
 * It represents the information of the peer.
 * This message is sent to discovery server when
 * the peer starts up.
 */
declare interface PeerMessage extends Peer {}

/**
 * It represents the number of device of which the peer is the server.
 * This message is sent to discovery server when a client connects
 * to the peer or disconnects from the peer.
 */
declare type PeerDeviceMessage = number;
