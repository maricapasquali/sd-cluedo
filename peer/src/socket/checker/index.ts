import {Socket as PeerClient} from 'socket.io';
import {Socket as PeerServer} from 'socket.io-client';
import {CPeer} from '@model/checker';
import {getAuth} from '../utils';

export namespace SocketChecker {
  /**
   * Check if socket belongs to a gamer of the given game.
   * @param socket socket to check.
   * @param gamerId identifier of gamer to check.
   */
  export function isGamer(
    socket: PeerClient | PeerServer,
    gamerId?: string
  ): boolean {
    const _auth: any = getAuth(socket);
    const _isGamer = _auth.gamerId && _auth.gameId;
    return gamerId ? _isGamer && gamerId === _auth.gamerId : _isGamer;
  }

  /**
   * Check if socket belongs to a peer.
   * @param socket socket to check.
   */
  export function isPeer(socket: PeerClient | PeerServer): boolean {
    const _auth: any = getAuth(socket);
    try {
      CPeer.check(_auth);
      return true;
    } catch (err) {
      return false;
    }
  }
}
