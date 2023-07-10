import {Server, Socket} from 'socket.io';
import {logger} from '@utils/logger';

import {findPeer, updatePeer} from '../manager';
import {PeerDeviceManager} from '../devices-manager';
import {Peers} from '@model';

export namespace NamespaceEvent {
  export const PEER = '/discovery/peer';
  export const PEER_DELETE = PEER + '/delete';
  export const PEER_DEVICES = PEER + '/devices';
}
export default function handlerSocket(socketServer: Server): void {
  socketServer
    .use((socket, next) => {
      const {peerId} = socket.handshake.auth;
      if (typeof peerId === 'string') next();
      else next(new Error('peerId is not set in handshake.auth'));
    })
    .on('connection', (socket: Socket) => {
      const _socketDebugStr = 'Socket (id) %s (peer = %s): ';
      logger.debug(
        'Socket ID = %s (peerId = %s) connects',
        socket.id,
        socket.handshake.auth.peerId
      );
      const {peerId, nConnectedDevice} = socket.handshake.auth;
      PeerDeviceManager.addNumberOfPeerDevices(peerId, nConnectedDevice);

      socket.on('disconnect', reason => {
        logger.debug(
          _socketDebugStr + 'disconnect = %s',
          socket.id,
          socket.handshake.auth.peerId,
          reason
        );
        PeerDeviceManager.removeNumberOfPeerDevices(
          socket.handshake.auth.peerId
        );
        updatePeer(socket.handshake.auth.peerId, Peers.Status.OFFLINE);
        const peer = findPeer(socket.handshake.auth.peerId);
        if (peer) {
          socketServer.emit(NamespaceEvent.PEER, peer as PeerMessage);
        }
      });

      socket.on(NamespaceEvent.PEER_DEVICES, (nClients, ack) => {
        logger.debug(
          _socketDebugStr + '# connected clients = %s',
          socket.id,
          socket.handshake.auth.peerId,
          nClients
        );
        PeerDeviceManager.addNumberOfPeerDevices(
          socket.handshake.auth.peerId,
          nClients
        );
        if (typeof ack === 'function') {
          ack(nClients);
        }
      });
    });
}
