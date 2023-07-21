import {Server, Socket} from 'socket.io';
import {CPeer} from '@model/checker';

export function sids(sockets: Socket[]): string[] {
  return sockets.map(s => s.id);
}

export namespace Clients {
  export function all(server: Server): Socket[] {
    return [...server.sockets.adapter.nsp.sockets.values()];
  }
  export function peer(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    return connectedSocket.filter(s => isPeer(s));
  }

  export function real(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    const _peerSocket: Socket[] = peer(server);
    return connectedSocket.filter(s => !_peerSocket.includes(s));
  }
  export function gamer(server: Server, gameId: string): Socket[] {
    return real(server).filter(
      s => isGamer(s) && s.handshake.auth.gameId === gameId
    );
  }

  export function isGamer(socket: Socket): boolean {
    return socket.handshake.auth.gamerId && socket.handshake.auth.gameId;
  }

  export function isPeer(socket: Socket): boolean {
    try {
      CPeer.check(socket.handshake.auth);
      return true;
    } catch (err) {
      return false;
    }
  }
}
