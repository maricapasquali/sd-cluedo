import {logger, loggerHttp} from '@utils/logger';
import {promises} from '@utils/test-helper';
import {Socket} from 'socket.io-client';
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
import {SocketChecker} from '../src/socket/checker';
import {getAuth} from '../src/socket/utils';
import {createServerStub} from '@utils/socket';

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
    {initSocketHandler: createPeerClientStub(peer, {peerServerManager})}
  );
}

export function upPeer(peer: Peer): Promise<HTTPSServerWithSocket> {
  return new Promise((resolve, reject) => {
    const httpsServerWithSocket = createPeerServer(peer);
    httpsServerWithSocket.httpsServer
      .listen(peer.port, peer.address, () => {
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
    if (SocketChecker.isPeer(socket)) return 'Peer (act as client)';
    if (SocketChecker.isGamer(socket)) return 'Gamer';
    return 'client';
  }
  const opts = socket.io?.opts;
  if (!opts?.hostname && !opts?.port) return _getReceiverInfo(socket);
  return `${_getReceiverInfo(socket)} on ${opts?.hostname}:${opts?.port}`;
}

export const othersPeers: Peer[] = [];
export const actualClients: Socket[] = [];
export const peerLikeClients: Socket[] = [];

export function gamersClientSocket(
  gameId: string,
  excludedGamer?: string
): Socket[] {
  const _gamers = actualClients.filter(
    s => SocketChecker.isGamer(s) && getAuth(s).gameId === gameId
  );
  return excludedGamer
    ? _gamers.filter(s => getAuth(s).gamerId !== excludedGamer)
    : _gamers;
}

export function noGamersClientSocket(gameId: string): Socket[] {
  return actualClients.filter(s => !gamersClientSocket(gameId).includes(s));
}
export function connectionToPeerServer({
  myPeer,
  myServer,
  nAttachedClientsForOtherPeer = 1,
}: {
  myPeer: Peer;
  myServer: Server;
  nAttachedClientsForOtherPeer?: number;
}): Promise<HTTPSServerWithSocket[]> {
  const peers = [
    {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.2',
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: myPeer.port + 1,
    },
    {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.3',
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: myPeer.port + 2,
    },
  ];
  othersPeers.push(...peers);
  const servers: HTTPSServerWithSocket[] = [];
  return Promise.all(peers.map(p => upPeer(p)))
    .then(res => {
      servers.push(...res);
      return Promise.all(
        peers.map(p =>
          connectSomeClientTo(p, {
            nClients: nAttachedClientsForOtherPeer,
          })
        )
      );
    })
    .then(() => {
      const httpsWithSocket: Promise<HTTPSServerWithSocket>[] = promises(
        servers,
        (serverWithSocket, index) => {
          return (resolve, reject) => {
            const peer = peers[index];
            const peerAddress = Peers.url(peer);
            const serverStub = createPeerServerStub(peerAddress, {
              myPeer: myPeer,
              mySocketServer: myServer,
              peerServerManager,
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
    });
}
export function upSomePeersLikeClientsToMe(
  nPeers: number,
  {
    myPeer,
    nAttachedClientsForOtherPeer = 1,
  }: {myPeer: Peer; nAttachedClientsForOtherPeer?: number}
): Promise<HTTPSServerWithSocket[]> {
  const _httpsSocket: Promise<HTTPSServerWithSocket>[] = [];
  const peers: Peer[] = [];
  for (let i = 0; i < nPeers; i++) {
    const peer: Peer = {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.' + (i + 4),
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: myPeer.port + (i + 3),
    };
    peers.push(peer);
    _httpsSocket.push(upPeer(peer));
  }
  othersPeers.push(...peers);
  return Promise.all(_httpsSocket).then(servers => {
    const sockets: Socket[] = servers.map((_httpsSocket, i) => {
      return createPeerServerStub(Peers.url(myPeer), {
        myPeer: peers[i],
        mySocketServer: _httpsSocket.socketServer,
        peerServerManager,
      });
    });
    peerLikeClients.push(...sockets);
    return Promise.all(
      peers.map(p =>
        connectSomeClientTo(p, {
          nClients: nAttachedClientsForOtherPeer,
        })
      )
    )
      .then(() => Promise.all([...clientSocketConnect(sockets)]))
      .then(() => servers);
  });
}

export function connectSomeClientTo(
  mePeer: Peer,
  {nClients}: {nClients: number}
): Promise<Socket[]> {
  const peerServerAddress = Peers.url(mePeer);
  const socketClients: Socket[] = [];
  for (let i = 0; i < nClients; i++) {
    const socket = createServerStub(peerServerAddress);
    socketClients.push(socket);
    actualClients.push(socket);
  }
  const connections = clientSocketConnect(socketClients);
  return Promise.all(connections).then(res => {
    if (res.length !== socketClients.length)
      throw new Error('Not all clients have connected');
    return socketClients;
  });
}

export function connectSomeGamerClient(gameId: string, gamers: Gamer[]) {
  const sockets: Socket[] = gamers.map((g, i) => {
    const _indexRand = Math.floor(Math.random() * (othersPeers.length - 1));
    const _attachOnPeer = Peers.url(
      i === 0 ? othersPeers[0] : othersPeers[_indexRand]
    );
    return createServerStub(_attachOnPeer, {
      auth: {
        gameId: gameId,
        gamerId: g.identifier,
      },
    });
  });
  return Promise.all(clientSocketConnect(sockets)).then(gamersSockets => {
    actualClients.push(...gamersSockets);
    return gamersSockets;
  });
}
