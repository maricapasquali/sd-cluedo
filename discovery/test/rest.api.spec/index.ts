import postTests from './post-peer.spec';
import getTests from './get-peers.spec';
import patchTests from './patch-peer.spec';
import deleteTests from './delete-peer.spec';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {logger, loggerHttp} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import routes, {RouteName} from '../../src/routes';
import createHTTPSServer, {HTTPSServerConfig} from '@utils/https-server';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import createTokenManager from '../../src/token-manager';
import {Server} from 'https';
import {handlerResponseErrorCheck} from './helper';
import {ResponseStatus} from '@utils/rest-api/responses';

describe('Rest API', () => {
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: 'https://localhost:3000',
  });
  const peer: Peer = {
    protocol: Peers.Protocol.HTTPS,
    port: 3000,
    status: Peers.Status.ONLINE,
    identifier: uuid(),
    hostname: 'localhost',
    address: '192.198.1.1',
  };
  let server: Server;

  before(() => {
    const port: number = Number(process.env.PORT) || 3000;
    const serverConfig: HTTPSServerConfig = {
      options: {
        key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
        cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
      },
      uses: [express.json(), loggerHttp],
      routes,
      routesArgs: [createTokenManager('https://localhost:' + port)],
    };
    server = createHTTPSServer(serverConfig);
    server.listen(port, () => {
      logger.debug('Listen on ' + port);
    });
  });

  describe('POST ' + RouteName.PEERS, () => postTests(axiosInstance, {peer}));
  describe('GET ' + RouteName.PEERS, () => getTests(axiosInstance, {peer}));
  describe('PATCH ' + RouteName.PEER, () => patchTests(axiosInstance, {peer}));
  describe('DELETE ' + RouteName.PEER, () =>
    deleteTests(axiosInstance, {peer})
  );

  it('NOT FOUND PATCH ' + RouteName.PEERS, done => {
    axiosInstance
      .put(RouteName.PEERS, peer)
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(() => done())
      .catch(done);
  });

  after(() => {
    server.close(() => logger.debug('Close discovery server'));
  });
});
