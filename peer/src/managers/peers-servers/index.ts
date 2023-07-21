import {Socket as Server} from 'socket.io-client';
import {logger} from '@utils/logger';
import {Request} from 'express';

export class PeerServerManager {
  readonly peers: {peer: Peer; socket: Server}[] = [];
  addPeer(peer: Peer, socket: Server) {
    const index = this.findIndex(peer.identifier);
    if (index > -1) {
      Object.assign(this.peers[index], {peer, socket});
    } else {
      this.peers.push({
        peer,
        socket: socket,
      });
    }
    logger.debug(this.peers.map(i => i.peer));
  }
  removePeer(id: string) {
    const index = this.findIndex(id);
    if (index > -1) this.peers.splice(index, 1);
    logger.debug(this.peers.map(i => i.peer));
  }
  sockets(): Server[] {
    return this.peers.map(i => i.socket);
  }

  private findIndex(id: string): number {
    return this.peers.findIndex(i => i.peer.identifier === id);
  }
}

export namespace PeerServerManager {
  export function from(req: Request): PeerServerManager {
    const peerServerManager: PeerServerManager =
      req.app.get('peerServerManager');
    if (!peerServerManager) throw new Error('"peerServerManager" is not set');
    return peerServerManager;
  }
}
