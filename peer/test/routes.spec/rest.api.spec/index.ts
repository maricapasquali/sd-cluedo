import postGameSpec from './post-game.spec';
import getGamesSpec from './get-games.spec';
import getGameSpec from './get-game.spec';
import patchGameSpec from './patch-games.spec';
import deleteGameSpec from './delete-game.spec';
import postGamerSpec from './post-gamer.spec';
import deleteGamerSpec from './delete-gamer.spec';

import routes, {RestAPIRouteName} from '../../../src/routes';
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

const should = shouldFunc();

describe('Rest API', () => {
  const port: number = Number(process.env.PORT) || 3001;
  const peerServerAddress: string = 'https://localhost:' + port;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: peerServerAddress,
  });

  let httpsServer: Server;
  const cluedoGame: CluedoGame = {
    identifier: uuid(),
    gamers: [],
  };
  const gamerInRound: string = cluedoGame.gamers[0]?.identifier || uuid();

  before(done => {
    httpsServer = createHTTPSServer({
      options: {
        key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
        cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
      },
      uses: [express.json(), loggerHttp],
      routes,
    })
      .listen(port, () => {
        logger.debug('Listening on ' + peerServerAddress);
        done();
      })
      .on('error', done);
  });

  describe('POST ' + RestAPIRouteName.GAMES, () =>
    postGameSpec({axiosInstance, game: cluedoGame})
  );

  describe('GET ' + RestAPIRouteName.GAMES, () =>
    getGamesSpec({axiosInstance, game: cluedoGame})
  );

  describe('POST ' + RestAPIRouteName.GAMER, () =>
    postGamerSpec({axiosInstance, game: cluedoGame})
  );

  describe('DELETE ' + RestAPIRouteName.GAMER, () =>
    deleteGamerSpec({axiosInstance, game: cluedoGame})
  );

  describe('GET ' + RestAPIRouteName.GAME, () =>
    getGameSpec({axiosInstance, game: cluedoGame})
  );

  describe('PATCH ' + RestAPIRouteName.GAME, () =>
    patchGameSpec({axiosInstance, game: cluedoGame, gamerInRound})
  );

  describe('DELETE ' + RestAPIRouteName.GAME, () =>
    deleteGameSpec({axiosInstance, game: cluedoGame, gamerInRound})
  );

  after(done => {
    httpsServer.close(() => {
      logger.debug('Close peer');
      done();
    });
  });
});
