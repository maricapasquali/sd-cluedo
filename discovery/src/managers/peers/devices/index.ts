type PeersDevicesManagerType = {[peerId: string]: number};

/**
 * Its represents a generic manager of the number
 * of connected clients to connected peers.
 */
interface IPeersDevicesManager {
  /**
   * Number of connected client of peers.
   * registered to discovery server.
   */
  numberOfPeerDevices: PeersDevicesManagerType;

  /**
   * Add to discovery server the number of connected client of a peer.
   * @param peerId identifier of peer to add.
   * @param nClients number of connected clients on given peer.
   */
  addNumberOfPeerDevices(peerId: string, nClients?: number): void;

  /**
   * Remove all registered peer device from discovery server.
   * @param peerId identifier of peer to remove.
   */
  removeNumberOfPeerDevices(peerId: string): void;
}

/**
 * Implementation and instantiation of _IPeersDevicesManager_.
 */
const PeersDevicesManager: IPeersDevicesManager = new (class
  implements IPeersDevicesManager
{
  private readonly peerDevices: PeersDevicesManagerType = {};
  get numberOfPeerDevices(): PeersDevicesManagerType {
    return this.peerDevices;
  }
  addNumberOfPeerDevices(peerId: string, nClients?: number): void {
    if (typeof nClients !== 'number') {
      this.peerDevices[peerId] = 0;
    } else {
      this.peerDevices[peerId] = nClients;
    }
  }

  removeNumberOfPeerDevices(peerId: string): void {
    delete this.peerDevices[peerId];
  }
})();

export default PeersDevicesManager;
