interface IPeersManager {
  peers: Peer[];

  addPeer(peer: Peer): void;

  updatePeer(id: string, status: string): void;

  removePeer(id: string): void;

  findPeer(id: string): Peer | undefined;
}

const PeersManager: IPeersManager = new (class implements IPeersManager {
  private readonly _peers: Peer[] = [];

  get peers(): Peer[] {
    return this._peers;
  }

  addPeer(peer: Peer): void {
    const index: number = this.findIndexPeer(peer.identifier);
    if (index > -1) {
      this._peers.splice(index, 1, peer);
    } else {
      this._peers.push(peer);
    }
  }

  updatePeer(id: string, status: string): void {
    const index: number = this.findIndexPeer(id);
    if (index > -1) {
      this._peers.splice(index, 1, {...this._peers[index], status});
    }
  }

  removePeer(id: string): void {
    const index: number = this.findIndexPeer(id);
    if (index > -1) {
      this._peers.splice(index, 1);
    }
  }

  findPeer(id: string): Peer | undefined {
    return this._peers[this.findIndexPeer(id)];
  }

  private findIndexPeer(id: string): number {
    return this._peers.findIndex(p => p.identifier === id);
  }
})();

export default PeersManager;
