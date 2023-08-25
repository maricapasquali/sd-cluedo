/**
 * It represents a generic manager of peers.
 */
interface DiscoveryManager {
  /**
   * List of registered peer on discovery server.
   */
  peers: Peer[];

  /**
   * Add a peer on discovery server.
   * @param peer peer information to add.
   */
  addPeer(peer: Peer): void;

  /**
   * Update status of a given peer.
   * @param id identifier of peer to update.
   * @param status new status of peer.
   */
  updatePeer(id: string, status: string): void;

  /**
   * Remove a given peer from discovery server.
   * @param id identifier of peer to remove.
   */
  removePeer(id: string): void;

  /**
   * Find a peer given an identifier.
   * @param id identifier of peer to find.
   */
  findPeer(id: string): Peer | undefined;
}

/**
 * Implementation and instantiation of _DiscoveryManager_.
 */
const DiscoveryPeersManager: DiscoveryManager = new (class
  implements DiscoveryManager
{
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

export default DiscoveryPeersManager;
