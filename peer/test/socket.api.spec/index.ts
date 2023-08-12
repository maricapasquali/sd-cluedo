import gamersActionsSpec from './gamers-actions.spec';

import {Server} from 'socket.io';
import {logger} from '@utils/logger';
import {HTTPSServerWithSocket} from '@utils/https-server';
import {RestAPIRouteName} from '../../src/routes/routesNames';
import mongoose from 'mongoose';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {CluedoGameEvent} from '../../src/socket/events';
import {CluedoGames, GamerElements, Peers} from '@model';
import {v4 as uuid} from 'uuid';
import {promises} from '@utils/test-helper';
import {
  connectionToPeerServer,
  connectSomeClientTo,
  createPeerServer,
  getReceiverInfo,
  upSomePeersLikeClientsToMe,
  actualClients,
  othersPeers,
  peerLikeClients,
  peerServerManager,
} from '../helper';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

describe('Socket API', function () {
  this.timeout(process.env.ENV_CI === 'CI/CD' ? 300000 : 10000); // 5 minutes for db connection in gitlab-ci

  const port: number = Number(process.env.PORT) || 3001;
  const mePeer: Peer = {
    identifier: uuid(),
    hostname: 'localhost',
    address: '127.0.0.1',
    protocol: Peers.Protocol.HTTPS,
    status: Peers.Status.ONLINE,
    port: port,
  };
  othersPeers.push(mePeer);
  const peerServerAddress: string = Peers.url(mePeer);
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: peerServerAddress,
  });

  const nClients = 2;
  const nPeers = 2;
  const nOtherPeersClients = 1;

  let socketServer: Server;
  const mongodbURI: string =
    process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo-test';

  const uppedServers: HTTPSServerWithSocket[] = [];

  let game: CluedoGame;

  before(done => {
    mongoose
      .connect(mongodbURI)
      .then(iMongoose => iMongoose.connection.db?.dropDatabase())
      .then(() => {
        logger.debug('Open connection mongodb: uri ' + mongodbURI);

        const httpsWithSocket = createPeerServer(mePeer);
        uppedServers.push(httpsWithSocket);
        socketServer = httpsWithSocket.socketServer;
        httpsWithSocket.httpsServer
          .listen(port, mePeer.hostname, () => {
            logger.debug('Listening on ' + peerServerAddress);
            connectionToPeerServer({
              myPeer: mePeer,
              myServer: socketServer,
              nAttachedClientsForOtherPeer: nOtherPeersClients,
            }) //I act like a client
              .then(httpsWithSocket => {
                uppedServers.push(...httpsWithSocket);
                return upSomePeersLikeClientsToMe(nPeers, {
                  myPeer: mePeer,
                  nAttachedClientsForOtherPeer: nOtherPeersClients,
                }); // I  act like a server
              })
              .then(httpsWithSocket => {
                uppedServers.push(...httpsWithSocket);
                return connectSomeClientTo(mePeer, {
                  nClients,
                });
              })
              .then(() => done())
              .catch(done);
          })
          .on('error', err => {
            mongoose.disconnect();
            done(err);
          });
      })
      .catch(done);
  });

  it('when one client posts a new cluedo game, all other clients (even connected to other peers) should receive it', done => {
    const creator: Gamer = {
      identifier: uuid(),
      username: 'mario03',
      characterToken: GamerElements.CharacterName.MISS_SCARLET,
    };
    const receivers = promises(actualClients, client => {
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

  it('when one client joins in a existing game (status waiting), all other clients (even connected to other peers) should receive it', done => {
    const gamer: Gamer = {
      identifier: uuid(),
      username: 'jake-reed',
      characterToken: GamerElements.CharacterName.REVEREND_GREEN,
    };
    const receivers = promises(actualClients, client => {
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

  it('when one client exits from a existing game (status waiting), all other clients (even connected to other peers) should receive it', done => {
    const receivers = promises(actualClients, client => {
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
    });
  });

  after(async () => {
    await Promise.all(
      promises(
        [...actualClients, ...peerLikeClients, ...peerServerManager.sockets()],
        s => resolve => s.on('disconnect', () => resolve()).disconnect()
      )
    );
    logger.debug('Close sockets');
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    await Promise.all(
      promises(
        uppedServers.map(hs => hs.socketServer),
        (s: Server) => {
          return (resolve, reject) => {
            s.close(err => {
              if (err) reject(err);
              else {
                logger.debug('Close socket server');
                resolve();
              }
            });
          };
        }
      )
    );
    await mongoose.disconnect();
    logger.debug('Close connection with mongodb');
  });
});
