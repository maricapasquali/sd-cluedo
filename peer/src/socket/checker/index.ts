import {Socket as PeerClient} from 'socket.io';
import {Socket as PeerServer} from 'socket.io-client';
import {CPeer} from '@model/checker';
import {getAuth} from '../utils';

export namespace SocketChecker {
  export function isGamer(
    socket: PeerClient | PeerServer,
    gamerId?: string
  ): boolean {
    const _auth: any = getAuth(socket);
    const _isGamer = _auth.gamerId && _auth.gameId;
    return gamerId ? _isGamer && gamerId === _auth.gamerId : _isGamer;
  }
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
