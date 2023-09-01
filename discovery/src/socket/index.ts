import {Server, Socket} from 'socket.io';
import {logger} from '@utils/logger';

import DiscoveryPeersManager from '../managers/peers';
import PeersDevicesManager from '../managers/peers/devices';
import {Peer} from '@model';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';

export default function handlerSocket(socketServer: Server): void {
  socketServer
    .use((socket, next) => {
      const {peerId} = socket.handshake.auth;
      if (typeof peerId === 'string') next();
      else next(new Error('peerId is not set in handshake.auth'));
    })
    .on('connection', (socket: Socket) => {
      const _socketDebugStr = 'Socket (id) %s (peer = %s): ';
      logger.info(
        'Socket ID = %s (peerId = %s) connects: nDevices = %s',
        socket.id,
        socket.handshake.auth.peerId,
        socket.handshake.auth.nConnectedDevice
      );
      const {peerId, nConnectedDevice} = socket.handshake.auth;
      PeersDevicesManager.addNumberOfPeerDevices(peerId, nConnectedDevice);

      socket.on('disconnect', reason => {
        logger.info(
          _socketDebugStr + 'disconnect = %s',
          socket.id,
          socket.handshake.auth.peerId,
          reason
        );
        PeersDevicesManager.removeNumberOfPeerDevices(
          socket.handshake.auth.peerId
        );
        DiscoveryPeersManager.updatePeer(
          socket.handshake.auth.peerId,
          Peer.Status.OFFLINE
        );
        const peer = DiscoveryPeersManager.findPeer(
          socket.handshake.auth.peerId
        );
        if (peer) {
          socketServer.emit(DiscoveryPeerEvent.PEER, peer as PeerMessage);
        }
      });

      socket.on(DiscoveryPeerEvent.PEER_DEVICES, (nClients, ack) => {
        logger.info(
          _socketDebugStr + '# connected clients = %s',
          socket.id,
          socket.handshake.auth.peerId,
          nClients
        );
        PeersDevicesManager.addNumberOfPeerDevices(
          socket.handshake.auth.peerId,
          nClients
        );
        if (typeof ack === 'function') {
          ack(nClients);
        }
      });
    });
}
