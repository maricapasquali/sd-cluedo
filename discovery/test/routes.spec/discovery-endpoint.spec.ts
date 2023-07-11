import {
  createDiscoveryServerWithSocketServer,
  mocksPeerClient,
  mocksPeerServer,
} from '../helper';
import {logger} from '@utils/logger';
import {Server as HTTPSServer} from 'https';
import {Server} from 'socket.io';
import {createAxiosInstance} from '@utils/axios';
import {Socket} from 'socket.io-client';
import {AxiosInstance} from 'axios/index';
import {handlerResponseErrorCheck} from '../helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {DiscoveryRouteName} from '../../src/routes';
import {should as shouldFunc} from 'chai';
import {Peers} from '@model';
import {AxiosResponse} from 'axios';

const should = shouldFunc();

describe('Discovery Endpoint', () => {
  const peersHttpsServer: HTTPSServer[] = [];
  const nClients = 5;
  const socketPeers: Socket[] = [];
  let discoveryServerAddress: string;
  let discoverySocketServer: Server;
  let axiosInstance: AxiosInstance;

  before(done => {
    const port: number = Number(process.env.PORT) || 3000;
    discoveryServerAddress = 'https://localhost:' + port;

    const httpsSocket = createDiscoveryServerWithSocketServer(port);
    const discoveryHttpsServer: HTTPSServer = httpsSocket.httpsServer;
    discoverySocketServer = httpsSocket.socketServer;

    discoveryHttpsServer
      .listen(port, () => {
        logger.debug('Listen on ' + port);
        axiosInstance = createAxiosInstance({
          baseURL: discoveryServerAddress,
        });
        done();
      })
      .on('error', done);
  });

  describe('Base Endpoint', () => {
    it('404 error', done => {
      axiosInstance
        .get(DiscoveryRouteName.BASE)
        .then(done)
        .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
        .then(done)
        .catch(done);
    });

    describe('User opens browser to discovery server address', () => {
      const peers: Peer[] = [];
      let nDevices: number[];

      before(done => {
        const posts: Promise<AxiosResponse>[] = [];
        const connections: Promise<Socket>[] = [];
        const peerServers = [];
        nDevices = Array.from(
          {length: nClients},
          () => Math.floor(Math.random() * 101) + 1
        );
        logger.debug(nDevices);

        for (let i = 0; i < nClients; i++) {
          const {peer, post, connection} = mocksPeerClient(i, {
            discoveryServerAddress,
            nConnectedDevice: nDevices[i],
          });
          peers.push(peer);
          posts.push(post);
          connections.push(connection);
          peerServers.push(
            new Promise<HTTPSServer>((resolve, reject) => {
              const server = mocksPeerServer();
              server
                .listen(peer.port, () => {
                  logger.debug('Listen on ' + Peers.url(peer));
                  resolve(server);
                })
                .on('error', reject);
            })
          );
        }
        Promise.all(peerServers)
          .then(servers => {
            peersHttpsServer.push(...servers);
            return Promise.all(connections);
          })
          .then((res: Socket[]) => {
            socketPeers.push(...res);
            logger.debug(socketPeers.map(s => s.id));
            return Promise.all(posts);
          })
          .then(res => {
            logger.debug(res.map(r => r.status));
            done();
          })
          .catch(done);
      });

      it('redirect to peer with least connected devices', done => {
        axiosInstance
          .get(DiscoveryRouteName.BASE)
          .then(res => {
            const minDevices = Math.min(...nDevices);
            const peersWithMinDevices = peers
              .map((p, i) => Object.assign(p, {nDevices: nDevices[i]}))
              .filter(p => p.nDevices === minDevices)
              .map(p => p.address);
            res.request.host.should.be.oneOf(peersWithMinDevices);
            done();
          })
          .catch(done);
      });
    });
  });

  after(() => {
    socketPeers.forEach(c => c.disconnect());
    peersHttpsServer.forEach(s => s.close());
    discoverySocketServer.close();
  });
});
