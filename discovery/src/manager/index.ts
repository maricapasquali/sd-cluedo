const _peers: Peer[] = [];

export function peers(): Peer[] {
  return _peers;
}

export function addPeer(peer: Peer): void {
  _peers.push(peer);
}

export function updatePeer(id: string, status: string): void {
  const index: number = findIndexPeer(id);
  if (index > -1) {
    _peers.splice(index, 1, {..._peers[index], status});
  }
}

export function removePeer(id: string): void {
  const index: number = findIndexPeer(id);
  if (index > -1) {
    _peers.splice(index, 1);
  }
}

export function findPeer(id: string): Peer | undefined {
  return _peers[findIndexPeer(id)];
}

function findIndexPeer(id: string): number {
  return _peers.findIndex(p => p.identifier === id);
}
