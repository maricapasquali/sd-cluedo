import {createDiscoveryServerWithSocketServer, promises} from '../helper';
import {Server as HTTPSServer} from 'https';
import {logger} from '@utils/logger';
import {io as Client, Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {DiscoveryPeerEvent} from '../../src/socket';
import {v4 as uuid} from 'uuid';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../src/routes';
import {createAxiosInstance} from '@utils/axios';
import {Peers} from '@model';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

describe('Socket API', () => {
  const peer: Peer = {
    identifier: uuid(),
    protocol: 'https',
    address: '192.178.1.8',
    port: 3000,
    status: 'online',
    hostname: 'host-7',
  };
  const nClients = 5;
  const socketPeers: Socket[] = [];

  let httpsServer: HTTPSServer;
  let socketServer: Server;
  let socketPeer: Socket;
  let axiosInstance: AxiosInstance;
  let discoveryServerAddress: string;

  before(done => {
    const port: number = Number(process.env.PORT) || 3000;
    discoveryServerAddress = 'https://localhost:' + port;

    const httpsSocket = createDiscoveryServerWithSocketServer(port);
    httpsServer = httpsSocket.httpsServer;
    socketServer = httpsSocket.socketServer;

    httpsServer.listen(port, () => {
      logger.debug('Listen on ' + port);
      done();
    });
  });

  describe('Connection', () => {
    it('connect some peer', done => {
      axiosInstance = createAxiosInstance({
        baseURL: discoveryServerAddress,
      });

      const posts = [];
      const connections = [];

      for (let i = 0; i < nClients; i++) {
        const peer: Peer = {
          identifier: uuid(),
          protocol: 'https',
          address: '192.178.1.' + (i + 1),
          port: 3000,
          status: 'online',
          hostname: 'host-' + i,
        };
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
      Promise.all([...connections, ...posts])
        .then(res => {
          logger.debug(res);
          done();
        })
        .catch(done);
    });

    it("if the parameter 'auth.peerId' is missing in the handshake, it should get a connect_error", done => {
      const client = Client(discoveryServerAddress, {
        secure: true,
        autoConnect: false,
        rejectUnauthorized: false,
        auth: {},
      });
      client
        .connect()
        .once('connect', () => done(new Error('peer is connected')))
        .once('connect_error', reason => {
          logger.debug(reason);
          done();
        });
    });
  });

  describe(DiscoveryPeerEvent.PEER + ' event', () => {
    it('when one peer posts himself, other peers should receive his information', done => {
      socketPeer = Client(discoveryServerAddress, {
        secure: true,
        autoConnect: true,
        rejectUnauthorized: false,
        auth: {
          peerId: peer.identifier,
        },
      })
        .once('connect', () => {
          logger.debug(socketPeer.id + ': connected');
        })
        .once('connect_error', err => {
          logger.error(socketPeer.id + ': err ', err);
        });

      const receiver = promises<number>(socketPeers, peerAsClient => {
        return (resolve, reject) => {
          peerAsClient.once(DiscoveryPeerEvent.PEER, (_peer: PeerMessage) => {
            try {
              logger.debug(
                "Event '%s' (add new peer)",
                DiscoveryPeerEvent.PEER
              );
              _peer.should.deep.equal(peer);
              resolve(200);
            } catch (err) {
              reject(err);
            }
          });
        };
      });

      const post = axiosInstance
        .post(RestAPIRouteName.PEERS, peer, {
          headers: {'x-forwarded-for': peer.address},
        })
        .then(res => res.status);

      Promise.all([...receiver, post])
        .then(res => {
          logger.debug(res);
          done();
        })
        .catch(done);
    });

    it('when one peer changes his status, other peers should receive it', done => {
      const receiver = promises<number>(socketPeers, peerAsClient => {
        return (resolve, reject) => {
          peerAsClient.once(DiscoveryPeerEvent.PEER, (_peer: PeerMessage) => {
            try {
              logger.debug(
                "Event '%s' (update status peer)",
                DiscoveryPeerEvent.PEER
              );
              _peer.should.have
                .property('status')
                .equal(Peers.Status.SHAREABLE);
              resolve(200);
            } catch (err) {
              logger.error(err);
              reject(err);
            }
          });
        };
      });
      const updateStatusPromise = axiosInstance
        .patch(
          RestAPIRouteName.PEER,
          {status: Peers.Status.SHAREABLE},
          {
            headers: {'x-forwarded-for': peer.address},
            urlParams: {
              id: peer.identifier,
            },
          }
        )
        .then(res => {
          peer.status = Peers.Status.SHAREABLE;
          return res.status;
        });
      Promise.all([...receiver, updateStatusPromise])
        .then(res => {
          logger.debug(res);
          done();
        })
        .catch(done);
    });
  });

  describe(DiscoveryPeerEvent.PEER_DELETE + ' event', () => {
    it('when one peer deletes himself, other peers should receive it', done => {
      const receiver = promises<number>(socketPeers, peerAsClient => {
        return (resolve, reject) => {
          peerAsClient.once(
            DiscoveryPeerEvent.PEER_DELETE,
            (_peer: PeerMessage) => {
              try {
                logger.debug(
                  "Event '%s' (delete peer) ",
                  DiscoveryPeerEvent.PEER_DELETE
                );
                _peer.should.deep.equal(peer);
                resolve(200);
              } catch (err) {
                logger.error(err);
                reject(err);
              }
            }
          );
        };
      });

      const deletePromise = axiosInstance
        .delete(RestAPIRouteName.PEER, {
          headers: {'x-forwarded-for': peer.address},
          urlParams: {
            id: peer.identifier,
          },
        })
        .then(res => res.status);
      Promise.all([...receiver, deletePromise])
        .then(res => {
          logger.debug(res);
          done();
        })
        .catch(done);
    });
  });

  describe(DiscoveryPeerEvent.PEER_DEVICES + ' event', () => {
    it('when a new client connects to the peer, discovery server should receive the updated number of peer clients', done => {
      const _numConnectedDevices: PeerDeviceMessage = 3;
      socketPeers[0].emit(
        DiscoveryPeerEvent.PEER_DEVICES,
        _numConnectedDevices,
        (response: any) => {
          logger.debug(response);
          response.should.equal(_numConnectedDevices);
          done();
        }
      );
    });

    it('when a peer disconnects, other peers should receive it', done => {
      const receiver = promises<number>(
        socketPeers.filter((s, i) => i > 0),
        peerAsClient => {
          return (resolve, reject) => {
            peerAsClient.once(DiscoveryPeerEvent.PEER, (_peer: PeerMessage) => {
              try {
                logger.debug(
                  "Event '%s' (offline peer) ",
                  DiscoveryPeerEvent.PEER
                );
                _peer.should.have
                  .property('status')
                  .equal(Peers.Status.OFFLINE);
                resolve(200);
              } catch (err) {
                logger.error(err);
                reject(err);
              }
            });
          };
        }
      );
      Promise.all([...receiver])
        .then(() => done())
        .catch(done);
      socketPeers[0].disconnect();
    });
  });

  after(() => {
    [socketPeer, ...socketPeers].forEach(c => c.disconnect());
    socketServer.close();
  });
});
