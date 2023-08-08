import {should as shouldFunc} from 'chai';
import PeersManager from '../src/managers/peers';
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
    PeersManager.peers.should.have.lengthOf(0);
  });

  it('#addPeer()', () => {
    PeersManager.addPeer(peer);
    const _peers: Peer[] = PeersManager.peers;
    _peers.should.have.lengthOf(1);
    _peers.should.contains(peer);
  });

  it('#updatePeer()', () => {
    should.exist(PeersManager.findPeer(peer.identifier));
    PeersManager.updatePeer(peer.identifier, Peers.Status.OFFLINE);
    PeersManager.peers.should.have.lengthOf(1);
    PeersManager.findPeer(peer.identifier)
      ?.should.have.property('status')
      .equal(Peers.Status.OFFLINE);
  });

  it('#removePeer()', () => {
    PeersManager.removePeer(peer.identifier);
    const _peers: Peer[] = PeersManager.peers;
    _peers.should.have.lengthOf(0);
    _peers.should.not.contains(peer);
  });
});
