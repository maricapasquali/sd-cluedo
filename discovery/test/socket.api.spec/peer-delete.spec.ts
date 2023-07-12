import {promises} from '../helper';
import {DiscoveryPeerEvent} from '../../src/socket';
import {logger} from '@utils/logger';
import {RestAPIRouteName} from '../../src/routes';
import {Socket} from 'socket.io-client';
import {AxiosInstance} from 'axios';

type DeleteSpecOptions = {
  socketPeers: Socket[];
  axiosInstance: AxiosInstance;
  peer: Peer;
};
export default function ({
  socketPeers,
  axiosInstance,
  peer,
}: DeleteSpecOptions): void {
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
}
