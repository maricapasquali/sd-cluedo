import postGameSpec from './post-game.spec';
import getGamesSpec from './get-games.spec';
import getGameSpec from './get-game.spec';
import patchGameSpec from './patch-games.spec';
import postGamerSpec from './post-gamer.spec';
import deleteGamerSpec from './delete-gamer.spec';

import routes from '../../../src/routes';
import {RestAPIRouteName} from '../../../src/routes/routesNames';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {createHTTPSServer} from '@utils/https-server';
import {Server} from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import {logger, loggerHttp} from '@utils/logger';
import {v4 as uuid} from 'uuid';

import {should as shouldFunc} from 'chai';
import mongoose from 'mongoose';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGame, GameElements, Peer} from '@model';
import {gamersAuthenticationTokens} from '../../helper';
import {MongoDBGamesManager} from '../../../src/managers/games/mongoose';

const should = shouldFunc();

describe('Rest API', function () {
  this.timeout(process.env.ENV_CI === 'CI/CD' ? 300000 : 10000); // 5 minutes for db connection in gitlab-ci

  const mongodbURI: string =
    process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo-test';

  const port: number = Number(process.env.PORT) || 3001;
  const peerServerAddress: string = 'https://localhost:' + port;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: peerServerAddress,
  });
  const peer: Peer = {
    identifier: uuid(),
    protocol: Peer.Protocol.HTTPS,
    hostname: 'localhost',
    port,
    status: Peer.Status.ONLINE,
  };
  let httpsServer: Server;

  before(done => {
    mongoose
      .connect(mongodbURI)
      .then(iMongoose => iMongoose.connection.db?.dropDatabase())
      .then(() => {
        const httpsOptions = {
          key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
          cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
        };
        httpsServer = createHTTPSServer({
          options: httpsOptions,
          uses: [express.json(), express.text(), loggerHttp],
          routes: routes({
            peer,
          }),
          sets: {
            tokensManager: BasicTokenManager.create({
              issuer: peerServerAddress,
              publicKey: httpsOptions.cert,
              privateKey: httpsOptions.key,
            }),
          },
        })
          .listen(port, () => {
            logger.debug('Listening on ' + peerServerAddress);
            done();
          })
          .on('error', err => {
            mongoose.disconnect();
            done(err);
          });
      })
      .catch(done);
  });

  describe('POST ' + RestAPIRouteName.GAMES, () =>
    postGameSpec({axiosInstance})
  );

  describe('GET ' + RestAPIRouteName.GAMES, () =>
    getGamesSpec({axiosInstance})
  );

  describe('POST ' + RestAPIRouteName.GAMERS, () =>
    postGamerSpec({axiosInstance})
  );

  describe('DELETE ' + RestAPIRouteName.GAMER, () =>
    deleteGamerSpec({axiosInstance})
  );

  describe('GET ' + RestAPIRouteName.GAME, () => getGameSpec({axiosInstance}));

  describe('PATCH ' + RestAPIRouteName.GAME, () =>
    patchGameSpec({axiosInstance})
  );

  describe('410 error', () => {
    let startedGame: CluedoGame;
    before(done => {
      MongoDBGamesManager.getGames()
        .then(games => {
          startedGame =
            games.find(g => g.status !== CluedoGame.Status.WAITING) ||
            ({} as CluedoGame);
          done();
        })
        .catch(done);
    });
    it(
      'POST ' + RestAPIRouteName.GAMERS + ' on a started/finished game',
      done => {
        axiosInstance
          .post(
            RestAPIRouteName.GAMERS,
            {
              identifier: uuid(),
              username: 'hiro',
              characterToken: GameElements.CharacterName.REVEREND_GREEN,
            },
            {
              urlParams: {
                id: startedGame.identifier,
              },
            }
          )
          .then(done)
          .catch(err => handlerResponseErrorCheck(err, ResponseStatus.GONE))
          .then(done)
          .catch(done);
      }
    );
    it(
      'DELETE ' + RestAPIRouteName.GAMER + ' on a started/finished game',
      done => {
        const deletedGamer =
          startedGame.gamers[startedGame.gamers.length - 1].identifier;
        axiosInstance
          .delete(RestAPIRouteName.GAMER, {
            headers: {
              authorization: gamersAuthenticationTokens[deletedGamer],
            },
            urlParams: {
              id: startedGame.identifier,
              gamerId: deletedGamer,
            },
          })
          .then(done)
          .catch(err => handlerResponseErrorCheck(err, ResponseStatus.GONE))
          .then(done)
          .catch(done);
      }
    );
  });

  after(done => {
    mongoose
      .disconnect()
      .then(() => {
        httpsServer.close(() => {
          logger.debug('Close peer');
          done();
        });
      })
      .catch(done);
  });
});
