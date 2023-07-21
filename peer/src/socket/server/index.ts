import {Server, Socket} from 'socket.io';
import {logger} from '@utils/logger';
import {registerGameEventHandlers} from '../handlers';
import {Peers} from '@model';

export default function createPeerClientStub(
  peer: Peer
): (server: Server) => void {
  return (socketServer: Server) => {
    const peerAddress = Peers.url(peer);
    socketServer.on('connection', (socket: Socket) => {
      logger.info(
        '%s: Socket ID = %s connects. %s',
        peerAddress,
        socket.id,
        JSON.stringify(socket.handshake.auth)
      );
      //TODO: emit to discovery server number of clients connected

      registerGameEventHandlers(socketServer, socket, {peer});

      socket.on('disconnect', reason => {
        //TODO: emit to discovery server number of clients connected
        logger.info(
          'Peer (%s): Socket ID = %s disconnects. Reason = %s',
          peerAddress,
          socket.id,
          reason
        );
      });
    });
  };
}
