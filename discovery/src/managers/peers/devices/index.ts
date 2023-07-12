type PeersDevicesManagerType = {[peerId: string]: number};
interface IPeersDevicesManager {
  numberOfPeerDevices: PeersDevicesManagerType;
  addNumberOfPeerDevices(peerId: string, nClients?: number): void;
  removeNumberOfPeerDevices(peerId: string): void;
}

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
