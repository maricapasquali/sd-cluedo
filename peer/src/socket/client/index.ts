import {Server} from 'socket.io';
import {io as Client, Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {registerGameEventHandlers} from '../handlers';
import {Peers} from '@model';

type PeerClientConfig = {
  peer: Peer;
  mySelfServer: Server;
};
export function createPeerServerStub(
  serverAddress: string,
  {peer, mySelfServer}: PeerClientConfig
): Socket {
  const peerClient = Client(serverAddress, {
    secure: true,
    autoConnect: false,
    rejectUnauthorized: false,
    auth: {
      peerId: peer.identifier,
      ...peer,
    },
  })
    .on('connect', () => {
      logger.info(
        `Peer (${Peers.url(peer)}): Connected to ${serverAddress}: socket id ${
          peerClient.id
        }`
      );
      registerGameEventHandlers(mySelfServer, peerClient, {peer});
    })
    .on('connect_error', err => {
      logger.error(err);
    });
  return peerClient;
}
