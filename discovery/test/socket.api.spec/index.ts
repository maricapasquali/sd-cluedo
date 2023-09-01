import connectionSpec from './connection.spec';
import peerSpec from './peer.spec';
import peerDeleteSpec from './peer-delete.spec';
import peerDevicesSpec from './peer-devices.spec';
import {createDiscoveryServerWithSocketServer} from '../helper';
import {logger} from '@utils/logger';
import {Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {createAxiosInstance} from '@utils/axios';
import {Peer} from '@model';

const should = shouldFunc();

describe('Socket API', () => {
  const peer: Peer = {
    identifier: uuid(),
    protocol: Peer.Protocol.HTTPS,
    address: '127.0.0.8',
    port: 3010,
    status: Peer.Status.ONLINE,
    hostname: 'localhost',
  };
  const port: number = Number(process.env.PORT) || 3000;
  const discoveryServerAddress: string = 'https://localhost:' + port;
  const axiosInstance: AxiosInstance = createAxiosInstance({
    baseURL: discoveryServerAddress,
  });
  const socketPeers: Socket[] = [];

  let socketServer: Server;

  before(done => {
    const httpsSocket = createDiscoveryServerWithSocketServer(port);
    socketServer = httpsSocket.socketServer;
    httpsSocket.httpsServer
      .listen(port, () => {
        logger.debug('Listen on ' + port);
        done();
      })
      .on('error', done);
  });

  describe('Connection', () => {
    connectionSpec({
      discoveryServerAddress,
      socketPeers,
    });
  });

  describe(DiscoveryPeerEvent.PEER + ' event', () => {
    peerSpec({
      discoveryServerAddress,
      socketPeers,
      axiosInstance,
      peer,
    });
  });

  describe(DiscoveryPeerEvent.PEER_DELETE + ' event', () => {
    peerDeleteSpec({socketPeers, axiosInstance, peer});
  });

  describe(DiscoveryPeerEvent.PEER_DEVICES + ' event', () =>
    peerDevicesSpec({socketPeers})
  );

  after(() => {
    socketPeers.forEach(c => c?.disconnect());
    socketServer.close();
  });
});
