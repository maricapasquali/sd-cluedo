import gamersActionsSpec from './gamers-actions.spec';

import {io as Client, Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {logger, loggerHttp} from '@utils/logger';
import {createHTTPSServerWithSocketServer} from '@utils/https-server';
import routes, {RestAPIRouteName} from '../../../src/routes';
import mongoose from 'mongoose';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import handlerSocket, {CluedoGameEvent} from '../../../src/socket/server';
import {GamerElements} from '@model';
import {v4 as uuid} from 'uuid';
import {promises} from '@utils/test-helper';
import {clientSocketConnect} from '../../helper';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

describe('Socket API', function () {
  this.timeout(process.env.ENV_CI === 'CI/CD' ? 300000 : 10000); // 5 minutes for db connection in gitlab-ci

  const port: number = Number(process.env.PORT) || 3001;
  const peerServerAddress: string = 'https://localhost:' + port;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: peerServerAddress,
  });
  const nClients = 4;

  const socketClients: Socket[] = [];
  let socketServer: Server;
  const mongodbURI: string =
    process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo-test';

  let game: CluedoGame;

  before(done => {
    mongoose
      .connect(mongodbURI)
      .then(iMongoose => iMongoose.connection.db?.dropDatabase())
      .then(() => {
        logger.debug('Open connection mongodb: uri ' + mongodbURI);
        const httpsOptions = {
          key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
          cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
        };
        const httpsWithSocket = createHTTPSServerWithSocketServer(
          {
            options: httpsOptions,
            uses: [express.json(), express.text(), loggerHttp],
            routes,
            sets: {
              tokensManager: BasicTokenManager.create({
                issuer: peerServerAddress,
                publicKey: httpsOptions.cert,
                privateKey: httpsOptions.key,
              }),
            },
          },
          {initSocketHandler: handlerSocket}
        );
        socketServer = httpsWithSocket.socketServer;
        httpsWithSocket.httpsServer
          .listen(port, () => {
            logger.debug('Listening on ' + peerServerAddress);
            for (let i = 0; i < nClients; i++) {
              socketClients.push(
                Client(peerServerAddress, {
                  secure: true,
                  autoConnect: false,
                  rejectUnauthorized: false,
                })
              );
              socketClients.push(
                Client(peerServerAddress, {
                  secure: true,
                  autoConnect: false,
                  rejectUnauthorized: false,
                  auth: {
                    peerId: uuid(),
                  },
                })
              );
            }
            const connections = clientSocketConnect(socketClients);
            Promise.all(connections)
              .then(res => {
                if (res.length !== connections.length)
                  throw new Error('Not all clients have connected');
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
    const receivers = promises(socketClients, client => {
      return resolve => {
        client.once(
          CluedoGameEvent.CLUEDO_NEW_GAME,
          (game: CluedoGameMessage) => {
            logger.debug(game, 'receive game');
            resolve();
          }
        );
      };
    });
    const newGame = axiosInstance
      .post(RestAPIRouteName.GAMES, {
        identifier: uuid(),
        username: 'mario03',
        characterToken: GamerElements.CharacterName.MISS_SCARLET,
      })
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
    const receivers = promises(socketClients, client => {
      return resolve => {
        client.once(
          CluedoGameEvent.CLUEDO_NEW_GAMER,
          (message: GamerMessage) => {
            logger.debug(message, 'receive gamer');
            resolve();
          }
        );
      };
    });
    const gamer: Gamer = {
      identifier: uuid(),
      username: 'jake-reed',
      characterToken: GamerElements.CharacterName.REVEREND_GREEN,
    };
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
            logger.debug(message, 'receive removed gamer');
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
        Object.values(socketClients).forEach(c => c?.disconnect());
        socketServer.close(() => {
          logger.debug('Close socket server');
          done();
        });
      })
      .catch(done);
  });
});
