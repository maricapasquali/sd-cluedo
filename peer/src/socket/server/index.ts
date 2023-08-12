import {Server, Socket} from 'socket.io';
import {Socket as ClientSocket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {Peers} from '@model';
import {PeerServerManager} from '../../managers/peers-servers';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';
import {GamersSocket} from './clients';
import {getAuth} from '../utils';
import {SocketChecker} from '../checker';
import registerGamerHandlers, {
  onDisconnection as onDisconnectionGamer,
} from '../handlers/gamer';
import {
  registerGameEventHandlers,
  onDisconnection as onDisconnectionPeer,
} from '../handlers/peer';

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
      const auth = getAuth(socket);
      logger.info(
        '%s: Socket ID = %s connects. %s',
        peerAddress,
        socket.id,
        JSON.stringify(auth)
      );
      nDevices++;
      discoveryServerSocketClient?.emit(
        DiscoveryPeerEvent.PEER_DEVICES,
        nDevices
      );
      logger.debug('%s: #devices = %s', peerAddress, nDevices);
      if (SocketChecker.isGamer(socket)) {
        GamersSocket.register(auth);
        registerGamerHandlers(socketServer, socket, auth.gameId, {
          peer,
          peerServerManager,
        });
      }

      if (SocketChecker.isPeer(socket)) {
        registerGameEventHandlers(socketServer, socket, {
          peer,
          peerServerManager,
        });
      }

      socket.on('disconnect', reason => {
        logger.info(
          'Peer (%s): Socket ID = %s disconnects. Reason = %s',
          peerAddress,
          socket.id,
          reason
        );

        if (SocketChecker.isGamer(socket)) {
          onDisconnectionGamer(peer, socketServer, socket);
        }

        if (SocketChecker.isPeer(socket)) {
          onDisconnectionPeer(auth, socketServer);
        }

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
