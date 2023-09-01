import {Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {promises} from '@utils/test-helper';
import {DiscoveryPeerEvent, RestAPIRouteName} from '@discovery-peers-routes';
import {Peer} from '@model';
import {AxiosInstance} from 'axios';
import {createServerStub} from '@utils/socket';

type PeerSpecOptions = {
  discoveryServerAddress: string;
  socketPeers: Socket[];
  axiosInstance: AxiosInstance;
  peer: Peer;
};
export default function ({
  discoveryServerAddress,
  socketPeers,
  peer,
  axiosInstance,
}: PeerSpecOptions): void {
  let socketPeer: Socket;

  it('when one peer posts himself, other peers should receive his information', done => {
    socketPeer = createServerStub(discoveryServerAddress, {
      autoConnect: true,
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
            logger.debug("Event '%s' (add new peer)", DiscoveryPeerEvent.PEER);
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
            _peer.should.have.property('status').equal(Peer.Status.OFFLINE);
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
        {status: Peer.Status.OFFLINE},
        {
          headers: {'x-forwarded-for': peer.address},
          urlParams: {
            id: peer.identifier,
          },
        }
      )
      .then(res => {
        peer.status = Peer.Status.OFFLINE;
        return res.status;
      });
    Promise.all([...receiver, updateStatusPromise])
      .then(res => {
        logger.debug(res);
        done();
      })
      .catch(done);
  });

  after(() => {
    socketPeers.push(socketPeer);
  });
}
