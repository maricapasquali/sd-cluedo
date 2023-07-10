import postTests from './post-peer.spec';
import getTests from './get-peers.spec';
import patchTests from './patch-peer.spec';
import deleteTests from './delete-peer.spec';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {logger} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import {RouteName} from '../../src/routes';
import {Server} from 'https';
import {handlerResponseErrorCheck} from './helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {createAndUpDiscoveryServer} from '../helper';

describe('Rest API', () => {
  const port: number = Number(process.env.PORT) || 3000;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: 'https://localhost:' + port,
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

  before(done => {
    server = createAndUpDiscoveryServer(port);
    server.listen(port, () => {
      logger.debug('Listen on ' + port);
      done();
    });
  });

  describe('POST ' + RouteName.PEERS, () => postTests(axiosInstance, {peer}));
  describe('GET ' + RouteName.PEERS, () => getTests(axiosInstance, {peer}));
  describe('PATCH ' + RouteName.PEER, () => patchTests(axiosInstance, {peer}));
  describe('DELETE ' + RouteName.PEER, () =>
    deleteTests(axiosInstance, {peer})
  );

  it('NOT FOUND PUT ' + RouteName.PEERS, done => {
    axiosInstance
      .put(RouteName.PEERS, peer)
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  after(() => {
    server.close(() => logger.debug('Close discovery server'));
  });
});
