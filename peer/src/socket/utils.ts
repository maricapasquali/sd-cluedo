import {Socket as SocketInServer} from 'socket.io';
import {Socket as SocketInClient} from 'socket.io-client';
export function getAuth(socket: SocketInServer | SocketInClient): any {
  return (
    ((socket instanceof SocketInServer
      ? socket.handshake.auth
      : socket instanceof SocketInClient
      ? socket.auth
      : {}) as any) || {}
  );
}
