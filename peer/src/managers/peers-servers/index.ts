import {Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {Request} from 'express';
import {Peers} from '@model';

export type PeerServer = {peer: Peer; socket: Socket};

/**
 * It represents a generic peer server manager, that is a peer
 * on startup it connects (via sockets) to other peers which in
 * this case act as servers.
 */
export interface IPeerServerManager {
  /**
   * Add a pair peer-socket of the given peer.
   * @param peer peer to add.
   * @param socket socket to add.
   */
  addPeer(peer: Peer, socket: Socket): void;

  /**
   * Remove a pair peer-socket of the given peer.
   * @param id identifier of the peer to remove.
   */
  removePeer(id: string): void;

  /**
   * Retrieve all sockets of all peers acting as a server.
   */
  sockets(): Socket[];

  /**
   * Find a pair peer-socket given a peer identifier.
   * @param identifier identifier of the peer to find.
   */
  find(identifier: string): PeerServer | undefined;
}

/**
 * Implementation of _IPeerServerManager_.
 */
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
  /**
   * Retrieve a peer server manager from express request.
   * @param req express request.
   * @throws Error when a peer server manager is not set.
   */
  export function from(req: Request): IPeerServerManager {
    const peerServerManager: IPeerServerManager =
      req.app.get('peerServerManager');
    if (!peerServerManager) throw new Error('"peerServerManager" is not set');
    return peerServerManager;
  }
}
