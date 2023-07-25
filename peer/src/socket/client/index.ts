import {Server} from 'socket.io';
import {Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {registerGameEventHandlers} from '../handlers';
import {Peers} from '@model';
import {PeerServerManager} from '../../managers/peers-servers';
import {createServerStub} from '@utils/socket';
import {createAxiosInstance} from '@utils/axios';
import {RestAPIRouteName} from '../../routes/routesNames';
import {MongoDBGamesManager} from '../../managers/games/mongoose';
import {
  DiscoveryPeerEvent,
  RestAPIRouteName as DiscoveryRestAPIRouteName,
} from '@discovery-peers-routes';
import {AxiosError} from 'axios';

type PeerClientConfig = {
  myPeer: Peer;
  mySocketServer: Server;
  peerServerManager: PeerServerManager;
};
export function createPeerServerStub(
  serverAddress: string,
  {myPeer, mySocketServer, peerServerManager}: PeerClientConfig
): Socket {
  const peerClient: Socket = createServerStub(serverAddress, {
    auth: {
      peerId: myPeer.identifier,
      ...myPeer,
    },
  })
    .on('connect', () => {
      logger.info(
        `Peer (${Peers.url(
          myPeer
        )}): Connected to ${serverAddress}: socket id ${peerClient.id}`
      );
      createAxiosInstance({baseURL: serverAddress})
        .get(RestAPIRouteName.GAMES)
        .then(response => response.data)
        .then(games =>
          Promise.all(
            games.map((game: CluedoGame) =>
              MongoDBGamesManager.createGame(game)
            )
          )
        )
        .then(() => {
          registerGameEventHandlers(mySocketServer, peerClient, {
            peer: myPeer,
            peerServerManager,
          });
        })
        .catch(err => logger.error(err));
    })
    .on('connect_error', err => {
      logger.error(err);
    });
  return peerClient;
}

type DiscoveryClientConfig = {
  discoveryServerAddress: string;
  myPeer: Peer;
  mySocketServer: Server;
  peerServerManager: PeerServerManager;
};
export function connectAndListenOnDiscoveryServer(
  discoveryServerSocketClient: Socket,
  {
    discoveryServerAddress,
    myPeer,
    mySocketServer,
    peerServerManager,
  }: DiscoveryClientConfig
): void {
  discoveryServerSocketClient
    .connect()
    .on('connect', () => {
      logger.info('Connected to discovery server.');
      createAxiosInstance({
        baseURL: discoveryServerAddress,
      })
        .post(DiscoveryRestAPIRouteName.PEERS, myPeer, {
          headers: {'x-forwarded-for': myPeer.address},
        })
        .then(response => {
          logger.info('List of other peers.');
          logger.debug(response.data);
          response.data.peers
            .filter((p: Peer) => p.identifier !== myPeer.identifier)
            .map((peer: Peer) => ({
              peer,
              socket: createPeerServerStub(Peers.url(peer), {
                myPeer,
                mySocketServer,
                peerServerManager,
              }),
            }))
            .forEach(({peer, socket}: {peer: Peer; socket: Socket}) => {
              peerServerManager.addPeer(peer, socket);
              socket.connect();
            });
        })
        .catch((err: AxiosError) => logger.error(err));
    })
    .on('connect_error', err => logger.error(err))
    .on(DiscoveryPeerEvent.PEER, (peer: PeerMessage) => {
      logger.info('Peer (' + JSON.stringify(peer) + `) is ${peer.status}`);
      const fServer = peerServerManager.find(peer.identifier);
      if (fServer && (peer.status as Peers.Status) === Peers.Status.OFFLINE) {
        fServer.socket.disconnect();
        peerServerManager.removePeer(fServer.peer.identifier);
      }
    })
    .on(DiscoveryPeerEvent.PEER_DELETE, (peer: PeerMessage) => {
      logger.info(
        'Peer (' + JSON.stringify(peer) + ') is REMOVED from discovery server'
      );
      const fServer = peerServerManager.find(peer.identifier);
      if (fServer) {
        fServer.socket.disconnect();
        peerServerManager.removePeer(fServer.peer.identifier);
      }
    });
}
