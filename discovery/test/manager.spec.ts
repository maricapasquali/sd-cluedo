import {should as shouldFunc} from 'chai';
import DiscoveryPeersManager from '../src/managers/peers';
import {Peers} from '@model';
import {v4 as uuid} from 'uuid';

const should = shouldFunc();

describe('Discovery Manager', () => {
  const peer: Peer = {
    protocol: Peers.Protocol.HTTPS,
    port: 3000,
    status: Peers.Status.ONLINE,
    identifier: uuid(),
    hostname: 'localhost',
  };

  it('peers', () => {
    DiscoveryPeersManager.peers.should.have.lengthOf(0);
  });

  it('#addPeer()', () => {
    DiscoveryPeersManager.addPeer(peer);
    const _peers: Peer[] = DiscoveryPeersManager.peers;
    _peers.should.have.lengthOf(1);
    _peers.should.contains(peer);
  });

  it('#updatePeer()', () => {
    should.exist(DiscoveryPeersManager.findPeer(peer.identifier));
    DiscoveryPeersManager.updatePeer(peer.identifier, Peers.Status.OFFLINE);
    DiscoveryPeersManager.peers.should.have.lengthOf(1);
    DiscoveryPeersManager.findPeer(peer.identifier)
      ?.should.have.property('status')
      .equal(Peers.Status.OFFLINE);
  });

  it('#removePeer()', () => {
    DiscoveryPeersManager.removePeer(peer.identifier);
    const _peers: Peer[] = DiscoveryPeersManager.peers;
    _peers.should.have.lengthOf(0);
    _peers.should.not.contains(peer);
  });
});
