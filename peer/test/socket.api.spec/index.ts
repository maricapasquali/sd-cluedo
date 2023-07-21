import gamersActionsSpec from './gamers-actions.spec';

import {Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {logger} from '@utils/logger';
import {HTTPSServerWithSocket} from '@utils/https-server';
import {RestAPIRouteName} from '../../src/routes';
import mongoose from 'mongoose';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {CluedoGameEvent} from '../../src/socket/events';
import {CluedoGames, GamerElements, Peers} from '@model';
import {v4 as uuid} from 'uuid';
import {promises} from '@utils/test-helper';
import {
  connectionToPeerServer,
  connectSomeClientToMe,
  createPeerServer,
  getReceiverInfo,
  peerServerManager,
  upSomePeersLikeClientsToMe,
} from '../helper';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

describe('Socket API', function () {
  this.timeout(process.env.ENV_CI === 'CI/CD' ? 300000 : 10000); // 5 minutes for db connection in gitlab-ci

  const port: number = Number(process.env.PORT) || 3001;
  const peerServerAddress: string = 'https://localhost:' + port;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: peerServerAddress,
  });

  const mePeer: Peer = {
    identifier: uuid(),
    hostname: 'localhost',
    address: '127.0.0.1',
    protocol: Peers.Protocol.HTTPS,
    status: Peers.Status.ONLINE,
    port: port,
  };
  const otherPeers = [
    {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.2',
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: port + 1,
    },
    {
      identifier: uuid(),
      hostname: 'localhost',
      address: '127.0.0.3',
      protocol: Peers.Protocol.HTTPS,
      status: Peers.Status.ONLINE,
      port: port + 2,
    },
  ];

  const nClients = 2;
  const nPeers = 2;

  const socketClients: Socket[] = [];
  let socketServer: Server;
  const mongodbURI: string =
    process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo-test';

  const myPeerServers: HTTPSServerWithSocket[] = [];

  let game: CluedoGame;

  before(done => {
    mongoose
      .connect(mongodbURI)
      .then(iMongoose => iMongoose.connection.db?.dropDatabase())
      .then(() => {
        logger.debug('Open connection mongodb: uri ' + mongodbURI);

        const httpsWithSocket = createPeerServer(mePeer);
        socketServer = httpsWithSocket.socketServer;
        httpsWithSocket.httpsServer
          .listen(port, () => {
            logger.debug('Listening on ' + peerServerAddress);
            connectionToPeerServer(otherPeers, {
              myPeer: mePeer,
              myServer: socketServer,
            }) //I act like a client
              .then(httpsWithSocket => {
                myPeerServers.push(...httpsWithSocket.httpsWithSocket);
                socketClients.push(...httpsWithSocket.sockets);
                return upSomePeersLikeClientsToMe(nPeers, {myPeer: mePeer}); // I  act like a server
              })
              .then(httpsWithSocket => {
                myPeerServers.push(...httpsWithSocket.httpsWithSocket);
                socketClients.push(...httpsWithSocket.sockets);
                return connectSomeClientToMe(mePeer, {
                  nClients,
                });
              })
              .then(res => {
                socketClients.push(...res);
                done();
              })
              .catch(done);
          })
          .on('error', err => {
            mongoose.disconnect();
            done(err);
          });
      })
      .catch(done);
  });

  it('when one client posts a new cluedo game, other clients should receive it', done => {
    const creator: Gamer = {
      identifier: uuid(),
      username: 'mario03',
      characterToken: GamerElements.CharacterName.MISS_SCARLET,
    };
    const receivers = promises(socketClients, client => {
      return resolve => {
        client.once(
          CluedoGameEvent.CLUEDO_NEW_GAME,
          (game: CluedoGameMessage) => {
            logger.debug(getReceiverInfo(client) + ' receive game');
            should.exist(game);
            game.should.have
              .property('status')
              .equal(CluedoGames.Status.WAITING);
            game.gamers.should.a('array').not.empty;
            game.gamers
              .map((g: Gamer) => g.identifier)
              .should.contain(creator.identifier);
            resolve();
          }
        );
      };
    });
    const newGame = axiosInstance
      .post(RestAPIRouteName.GAMES, creator)
      .then(response => {
        game = response.data;
        return response;
      });
    Promise.all([...receivers, newGame])
      .then((res: any[]) => {
        if (res.length !== receivers.length + 1)
          throw new Error('Some promise has not been resolved');
        done();
      })
      .catch(done);
  });

  it('when one client joins in a existing game (status waiting), other clients should receive it', done => {
    const gamer: Gamer = {
      identifier: uuid(),
      username: 'jake-reed',
      characterToken: GamerElements.CharacterName.REVEREND_GREEN,
    };
    const receivers = promises(socketClients, client => {
      return resolve => {
        client.once(
          CluedoGameEvent.CLUEDO_NEW_GAMER,
          (message: GamerMessage) => {
            logger.debug(getReceiverInfo(client) + ' receive gamer');
            message.should.have.property('game').equal(game.identifier);
            message.should.have.property('gamer');
            message.gamer.should.have
              .property('identifier')
              .equal(gamer.identifier);
            message.gamer.should.have
              .property('username')
              .equal(gamer.username);
            message.gamer.should.have
              .property('characterToken')
              .equal(gamer.characterToken);
            resolve();
          }
        );
      };
    });
    const newGamer = axiosInstance.post(RestAPIRouteName.GAMERS, gamer, {
      urlParams: {
        id: game.identifier,
      },
    });
    Promise.all([...receivers, newGamer])
      .then((res: any[]) => {
        if (res.length !== receivers.length + 1)
          throw new Error('Some promise has not been resolved');
        game.gamers.push(gamer);
        done();
      })
      .catch(done);
  });

  it('when one client exits from a existing game (status waiting), other clients should receive it', done => {
    const receivers = promises(socketClients, client => {
      return resolve => {
        client.once(
          CluedoGameEvent.CLUEDO_REMOVE_GAMER,
          (message: ExitGamerMessage) => {
            logger.debug(getReceiverInfo(client) + ' receive removed gamer');
            message.should.have.property('game').equal(game.identifier);
            message.should.have
              .property('gamer')
              .equal(game.gamers[indexRemovedGamer].identifier);
            resolve();
          }
        );
      };
    });
    const indexRemovedGamer = game.gamers.length - 1;
    const newGamer = axiosInstance.delete(RestAPIRouteName.GAMER, {
      urlParams: {
        id: game.identifier,
        gamerId: game.gamers[indexRemovedGamer].identifier,
      },
    });
    Promise.all([...receivers, newGamer])
      .then((res: any[]) => {
        if (res.length !== receivers.length + 1)
          throw new Error('Some promise has not been resolved');
        game.gamers.splice(indexRemovedGamer, 1);
        done();
      })
      .catch(done);
  });

  describe('Play Game', () => {
    gamersActionsSpec({
      axiosInstance,
      peerServerAddress,
      socketClients,
    });
  });

  after(done => {
    mongoose
      .disconnect()
      .then(() => {
        logger.debug('Close connection with mongodb');
        Object.values(socketClients).forEach(c => c.disconnect());
        peerServerManager.sockets().forEach((s: Socket) => s.disconnect());
        return Promise.all(
          promises(
            [...myPeerServers.map(hs => hs.socketServer), socketServer],
            s => {
              return resolve => {
                s.close(() => {
                  logger.debug('Close socket server');
                  resolve();
                });
              };
            }
          )
        );
      })
      .then(() => {
        done();
      })
      .catch(done);
  });
});
