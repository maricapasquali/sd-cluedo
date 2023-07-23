import {Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {Request} from 'express';
import {Peers} from '@model';

export type PeerServer = {peer: Peer; socket: Socket};
export interface IPeerServerManager {
  addPeer(peer: Peer, socket: Socket): void;
  removePeer(id: string): void;
  sockets(): Socket[];
  find(identifier: string): PeerServer | undefined;
}

export class PeerServerManager implements IPeerServerManager {
  readonly peers: PeerServer[] = [];
  addPeer(peer: Peer, socket: Socket) {
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
  sockets(): Socket[] {
    return this.peers
      .filter(i => i.peer.status !== Peers.Status.OFFLINE)
      .map(i => i.socket);
  }
  find(identifier: string): PeerServer | undefined {
    return this.peers[this.findIndex(identifier)];
  }
  private findIndex(id: string): number {
    return this.peers.findIndex(i => i.peer.identifier === id);
  }
}

export namespace PeerServerManager {
  export function from(req: Request): IPeerServerManager {
    const peerServerManager: IPeerServerManager =
      req.app.get('peerServerManager');
    if (!peerServerManager) throw new Error('"peerServerManager" is not set');
    return peerServerManager;
  }
}
