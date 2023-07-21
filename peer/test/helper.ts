import {logger, loggerHttp} from '@utils/logger';
import {promises} from '@utils/test-helper';
import {io as Client, Socket} from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';
import {
  createHTTPSServerWithSocketServer,
  HTTPSServerWithSocket,
} from '@utils/https-server';
import * as express from 'express';
import routes from '../src/routes';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import {Peers} from '@model';
import {PeerServerManager} from '../src/managers/peers-servers';
import {v4 as uuid} from 'uuid';
import {Server} from 'socket.io';
import createPeerClientStub from '../src/socket/server';
import {createPeerServerStub} from '../src/socket/client';
import * as _ from 'lodash';

export const gamersAuthenticationTokens: {[gamerId: string]: string} = {};

export const games: CluedoGame[] = [];

export function nextGamer(game: CluedoGame, gamerInRound: string): string {
  const positionActualGamer = game.gamers.findIndex(
    g => g.identifier === gamerInRound
  );
  const positionNextGamer = (positionActualGamer + 1) % game.gamers.length;
  return game.gamers[positionNextGamer].identifier;
}

export const peerServerManager = new PeerServerManager();

export function createPeerServer(peer: Peer): HTTPSServerWithSocket {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  };
  return createHTTPSServerWithSocketServer(
    {
      options: httpsOptions,
      uses: [express.json(), express.text(), loggerHttp],
      routes,
      sets: {
        tokensManager: BasicTokenManager.create({
          issuer: Peers.url(peer),
          publicKey: httpsOptions.cert,
          privateKey: httpsOptions.key,
        }),
        peerServerManager,
      },
    },
    {initSocketHandler: createPeerClientStub(peer)}
  );
}

export function upPeer(peer: Peer): Promise<HTTPSServerWithSocket> {
  return new Promise((resolve, reject) => {
    const httpsServerWithSocket = createPeerServer(peer);
    httpsServerWithSocket.httpsServer
      .listen(peer.port, () => {
        logger.debug('Peer up on ' + Peers.url(peer));
        resolve(httpsServerWithSocket);
      })
      .on('error', reject);
  });
}

export function clientSocketConnect(sockets: Socket[]): Promise<Socket>[] {
  return promises(sockets, client => {
    return (resolve, reject) => {
      client
        .connect()
        .on('connect', () => {
          logger.debug(
            getReceiverInfo(client) + ' connected. socket id' + client.id
          );
          resolve(client);
        })
        .on('connect_error', reject);
    };
  });
}

export function getReceiverInfo(socket: Socket): string {
  function _getReceiverInfo(socket: Socket): string {
    if ((socket.auth as any)?.peerId) return 'Peer (act as client)';
    if ((socket.auth as any)?.gamerId) return 'Gamer';
    return 'client';
  }
  const {hostname, port} = socket.io.opts;
  return `${_getReceiverInfo(socket)} on ${hostname}:${port}`;
}

export const othersPeers: Peer[] = [];

export function connectionToPeerServer(
  peers: Peer[],
  {
    myPeer,
    myServer,
    nAttachedClientsForOtherPeer = 1,
  }: {myPeer: Peer; myServer: Server; nAttachedClientsForOtherPeer?: number}
): Promise<{
  httpsWithSocket: HTTPSServerWithSocket[];
  sockets: Socket[];
}> {
  othersPeers.push(...peers);
  const servers: HTTPSServerWithSocket[] = [];
  const socketsClients: Socket[] = [];
  return Promise.all(peers.map(p => upPeer(p)))
    .then(res => {
      servers.push(...res);
      return Promise.all(
        peers.map(p =>
          connectSomeClientToMe(p, {
            nClients: nAttachedClientsForOtherPeer,
          })
        )
      );
    })
    .then((res: Array<Socket[]>) => {
      socketsClients.push(..._.flatten(res));
      const httpsWithSocket: Promise<HTTPSServerWithSocket>[] = promises(
        servers,
        (serverWithSocket, index) => {
          return (resolve, reject) => {
            const peer = peers[index];
            const peerAddress = Peers.url(peer);
            const serverStub = createPeerServerStub(peerAddress, {
              peer: myPeer,
              mySelfServer: myServer,
            });
            peerServerManager.addPeer(peer, serverStub);
            serverStub
              .connect()
              .on('connect', () => {
                resolve(serverWithSocket);
              })
              .on('connect_error', reject);
          };
        }
      );
      return Promise.all(httpsWithSocket);
    })
    .then(() => ({
      httpsWithSocket: servers,
      sockets: socketsClients,
    }));
}
export function upSomePeersLikeClientsToMe(
  nPeers: number,
  {
    myPeer,
    nAttachedClientsForOtherPeer = 1,
  }: {myPeer: Peer; nAttachedClientsForOtherPeer?: number}
): Promise<{
  httpsWithSocket: HTTPSServerWithSocket[];
  peers: Peer[];
  sockets: Socket[];
}> {
  const _httpsSocket: Promise<HTTPSServerWithSocket>[] = [];
  const peers: Peer[] = [];
  for (let i = 0; i < nPeers; i++) {
    const peer: Peer = {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.' + (i + 4),
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: myPeer.port + (i + 4),
    };
    peers.push(peer);
    _httpsSocket.push(upPeer(peer));
  }
  othersPeers.push(...peers);
  return Promise.all(_httpsSocket).then(res => {
    const sockets: Socket[] = res.map((_httpsSocket, i) => {
      return createPeerServerStub(Peers.url(myPeer), {
        peer: peers[i],
        mySelfServer: _httpsSocket.socketServer,
      });
    });

    const otherPeerClients: Socket[] = [];
    return Promise.all(
      peers.map(p =>
        connectSomeClientToMe(p, {
          nClients: nAttachedClientsForOtherPeer,
        })
      )
    )
      .then((res: Array<Socket[]>) => {
        otherPeerClients.push(..._.flatten(res));
        return Promise.all([...clientSocketConnect(sockets)]);
      })
      .then((sockets: Socket[]) => {
        return {
          httpsWithSocket: res,
          peers,
          sockets: [...sockets, ...otherPeerClients],
        };
      });
  });
}

export function connectSomeClientToMe(
  mePeer: Peer,
  {nClients}: {nClients: number}
): Promise<Socket[]> {
  const peerServerAddress = Peers.url(mePeer);
  const socketClients: Socket[] = [];
  for (let i = 0; i < nClients; i++) {
    socketClients.push(
      Client(peerServerAddress, {
        secure: true,
        autoConnect: false,
        rejectUnauthorized: false,
      })
    );
  }
  const connections = clientSocketConnect(socketClients);
  return Promise.all(connections).then(res => {
    if (res.length !== socketClients.length)
      throw new Error('Not all clients have connected');
    return socketClients;
  });
}
