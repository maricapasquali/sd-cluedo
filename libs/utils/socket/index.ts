import {ManagerOptions} from 'socket.io-client/build/esm/manager';
import {SocketOptions} from 'socket.io-client/build/esm/socket';
import {io as Client, Socket} from 'socket.io-client';

type SocketAuthorization =
  | {
      [key: string]: any;
    }
  | ((cb: (data: object) => void) => void);

declare module 'socket.io-client' {
  interface Socket {
    /**
     * Updates the authorization information on the socket and reconnects it.
     * @param auth new authorization information
     */
    connectLike: (auth?: SocketAuthorization) => Socket;
  }
}

/**
 * Implementation of the method: _{@link connectLike}_.
 */
Socket.prototype.connectLike = function (auth?: SocketAuthorization): Socket {
  this.auth = auth || {};
  this.disconnect().connect();
  return this;
};

export function createServerStub(
  serverAddress?: string,
  opts?: Partial<ManagerOptions & SocketOptions>
) {
  const _opts = {
    secure: true,
    autoConnect: false,
    rejectUnauthorized: false,
    reconnection: true,
    ...opts,
  };
  return serverAddress ? Client(serverAddress, _opts) : Client(_opts);
}
