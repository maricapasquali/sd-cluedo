import postTests from './post-peer.spec';
import getTests from './get-peers.spec';
import patchTests from './patch-peer.spec';
import deleteTests from './delete-peer.spec';

import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {logger} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import server from '../../src';
import {RouteName} from '../../src/routes';

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

  describe('POST ' + RouteName.PEERS, () => postTests(axiosInstance, {peer}));
  describe('GET ' + RouteName.PEERS, () => getTests(axiosInstance, {peer}));
  describe('PATCH ' + RouteName.PEER, () => patchTests(axiosInstance, {peer}));
  describe('DELETE ' + RouteName.PEER, () =>
    deleteTests(axiosInstance, {peer})
  );

  after(() => {
    server.close(() => logger.debug('Close discovery server'));
  });
});
