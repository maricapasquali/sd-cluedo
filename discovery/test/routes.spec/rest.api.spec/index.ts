import postTests from './post-peer.spec';
import getTests from './get-peers.spec';
import patchTests from './patch-peer.spec';
import deleteTests from './delete-peer.spec';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {logger} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import {RestAPIRouteName} from '../../../src/routes';
import {Server} from 'https';
import {ResponseStatus} from '@utils/rest-api/responses';
import {
  handlerResponseErrorCheck,
  createAndUpDiscoveryServer,
} from '../../helper';

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
    server
      .listen(port, () => {
        logger.debug('Listen on ' + port);
        done();
      })
      .on('error', done);
  });

  describe('POST ' + RestAPIRouteName.PEERS, () =>
    postTests(axiosInstance, {peer})
  );
  describe('GET ' + RestAPIRouteName.PEERS, () =>
    getTests(axiosInstance, {peer})
  );
  describe('PATCH ' + RestAPIRouteName.PEER, () =>
    patchTests(axiosInstance, {peer})
  );
  describe('DELETE ' + RestAPIRouteName.PEER, () =>
    deleteTests(axiosInstance, {peer})
  );

  it('NOT FOUND PUT ' + RestAPIRouteName.PEERS, done => {
    axiosInstance
      .put(RestAPIRouteName.PEERS, peer)
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  after(() => {
    server.close(() => logger.debug('Close discovery server'));
  });
});
