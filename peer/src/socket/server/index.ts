import {Server, Socket} from 'socket.io';
import {Socket as ClientSocket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {registerGameEventHandlers} from '../handlers';
import {Peers} from '@model';
import {PeerServerManager} from '../../managers/peers-servers';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';

type AdditionalArg = {
  peerServerManager: PeerServerManager;
  discoveryServerSocketClient?: ClientSocket;
};
export default function createPeerClientStub(
  peer: Peer,
  {peerServerManager, discoveryServerSocketClient}: AdditionalArg
): (server: Server) => void {
  return (socketServer: Server) => {
    let nDevices = 0;
    const peerAddress = Peers.url(peer);
    socketServer.on('connection', (socket: Socket) => {
      logger.info(
        '%s: Socket ID = %s connects. %s',
        peerAddress,
        socket.id,
        JSON.stringify(socket.handshake.auth)
      );
      nDevices++;
      discoveryServerSocketClient?.emit(
        DiscoveryPeerEvent.PEER_DEVICES,
        nDevices
      );
      logger.debug('%s: #devices = %s', peerAddress, nDevices);
      registerGameEventHandlers(socketServer, socket, {
        peer,
        peerServerManager,
      });

      socket.on('disconnect', reason => {
        logger.info(
          'Peer (%s): Socket ID = %s disconnects. Reason = %s',
          peerAddress,
          socket.id,
          reason
        );
        nDevices--;
        discoveryServerSocketClient?.emit(
          DiscoveryPeerEvent.PEER_DEVICES,
          nDevices
        );
        logger.debug('%s: #devices = %s', peerAddress, nDevices);
      });
    });
  };
}
