import {DiscoveryPeerEvent} from '../../src/socket';
import {logger} from '@utils/logger';
import {promises} from '../helper';
import {Peers} from '@model';
import {Socket} from 'socket.io-client';

type DevicesSpecOptions = {
  socketPeers: Socket[];
};
export default function ({socketPeers}: DevicesSpecOptions): void {
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
              _peer.should.have.property('status').equal(Peers.Status.OFFLINE);
              resolve(200);
            } catch (err) {
              logger.error(err);
              reject(err);
            }
          });
        };
      }
    );
    Promise.all(receiver)
      .then(() => done())
      .catch(done);

    socketPeers[0].disconnect();
  });
}
