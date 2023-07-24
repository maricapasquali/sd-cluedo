import {ManagerOptions} from 'socket.io-client/build/esm/manager';
import {SocketOptions} from 'socket.io-client/build/esm/socket';
import {io as Client} from 'socket.io-client';

export function createServerStub(
  serverAddress: string,
  opts?: Partial<ManagerOptions & SocketOptions>
) {
  return Client(serverAddress, {
    secure: true,
    autoConnect: false,
    rejectUnauthorized: false,
    reconnection: true,
    ...opts,
  });
}
