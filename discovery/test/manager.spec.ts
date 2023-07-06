import {should as shouldFunc} from 'chai';
import {peers, addPeer, updatePeer, removePeer, findPeer} from '../src/manager';
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

  it('#peers()', () => {
    peers().should.have.lengthOf(0);
  });

  it('#addPeer()', () => {
    addPeer(peer);
    const _peers: Peer[] = peers();
    _peers.should.have.lengthOf(1);
    _peers.should.contains(peer);
  });

  it('#updatePeer()', () => {
    should.exist(findPeer(peer.identifier));
    updatePeer(peer.identifier, Peers.Status.SHAREABLE);
    peers().should.have.lengthOf(1);
    findPeer(peer.identifier)
      ?.should.have.property('status')
      .equal(Peers.Status.SHAREABLE);
  });

  it('#removePeer()', () => {
    removePeer(peer.identifier);
    const _peers: Peer[] = peers();
    _peers.should.have.lengthOf(0);
    _peers.should.not.contains(peer);
  });
});
