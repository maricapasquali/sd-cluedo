interface IPeerDeviceManager {
  addNumberOfPeerDevices(peerId: string, nClients?: number): void;
  removeNumberOfPeerDevices(peerId: string): void;
}

export const PeerDeviceManager: IPeerDeviceManager = new (class
  implements IPeerDeviceManager
{
  private peerDevices: {[peerId: string]: number} = {};
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
