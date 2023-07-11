import {createDiscoveryServerWithSocketServer, mocksPeerServer} from './helper';
import {logger} from '@utils/logger';
import {Server as HTTPSServer} from 'https';
import {Server} from 'socket.io';
import {createAxiosInstance} from '@utils/axios';
import {io as Client, Socket} from 'socket.io-client';
import {AxiosInstance} from 'axios/index';
import {handlerResponseErrorCheck, promises} from './helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {DiscoveryRouteName, RestAPIRouteName} from '../src/routes';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {Peers} from '@model';
import {DiscoveryPeerEvent} from '../src/socket';

const should = shouldFunc();

describe('Discovery Endpoint', () => {
  let discoveryServerAddress: string;
  let discoveryHttpsServer: HTTPSServer;
  let discoverySocketServer: Server;
  let axiosInstance: AxiosInstance;
  const peersHttpsServer: HTTPSServer[] = [];
  const nClients = 5;
  const socketPeers: Socket[] = [];

  before(done => {
    const port: number = Number(process.env.PORT) || 3000;
    discoveryServerAddress = 'https://localhost:' + port;

    const httpsSocket = createDiscoveryServerWithSocketServer(port);
    discoveryHttpsServer = httpsSocket.httpsServer;
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
        const posts = [];
        const connections = [];
        const peerServers = [];
        nDevices = Array.from(
          {length: nClients},
          () => Math.floor(Math.random() * 101) + 1
        );
        logger.debug(nDevices);

        for (let i = 1; i <= nClients; i++) {
          const peer: Peer = {
            identifier: uuid(),
            protocol: 'https',
            address: '127.0.0.' + (i + 1),
            port: 3000 + i,
            status: 'online',
            hostname: 'host-' + i,
          };
          peers.push(peer);
          peerServers.push(
            new Promise<number>(resolve => {
              const server = mocksPeerServer();
              server.listen(peer.port, () => {
                logger.debug('Listen on ' + Peers.url(peer));
                peersHttpsServer.push(server);
                resolve(201);
              });
            })
          );
          const clientPeer = Client(discoveryServerAddress, {
            secure: true,
            autoConnect: false,
            rejectUnauthorized: false,
            auth: {
              peerId: peer.identifier,
            },
          });
          connections.push(
            new Promise<number>((resolve, reject) => {
              clientPeer
                .connect()
                .on('connect', () => {
                  socketPeers.push(clientPeer);
                  resolve(201);
                })
                .on('connect_error', reject);
            })
          );
          posts.push(
            axiosInstance
              .post(RestAPIRouteName.PEERS, peer, {
                headers: {'x-forwarded-for': peer.address},
              })
              .then(res => {
                return res.status;
              })
          );
        }

        Promise.all([...connections, ...posts, ...peerServers])
          .then(() => {
            const emitDevices: Promise<void>[] = promises(
              socketPeers,
              (pC, index) => {
                return resolve => {
                  pC.emit(
                    DiscoveryPeerEvent.PEER_DEVICES,
                    nDevices[index],
                    () => resolve()
                  );
                };
              }
            );
            return Promise.all(emitDevices);
          })
          .then(() => done())
          .catch(done);
      });

      it('redirect to peer with least connected devices', done => {
        axiosInstance
          .get(DiscoveryRouteName.BASE)
          .then(res => {
            const minDevices = Math.min(...nDevices);
            const peersWithMinDevices = Object.entries(nDevices)
              .filter(([, v]) => minDevices === v)
              .map(([i]) => peers[Number(i)].address);
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
