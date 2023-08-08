import {Server, Socket as PeerClient} from 'socket.io';
import {Socket as PeerServer} from 'socket.io-client';
import {SocketChecker} from '../checker';
import {Peers} from '@model';
import {PeerServerManager} from '../../managers/peers-servers';

export function receiverName(
  server: Server,
  socket: PeerClient | PeerServer,
  peer: Peer
): string {
  if (socket instanceof PeerClient) {
    const auth = socket.handshake.auth as any;
    if (SocketChecker.isGamer(socket))
      return `Peer (${Peers.url(peer)}) (like server for GAMER) `;
    return `Peer (${Peers.url(peer)}) (like server for ${auth?.address}:${
      auth?.port
    }) `;
  } else if (socket instanceof PeerServer) {
    const {hostname, port} = socket.io.opts;
    if (hostname && port)
      return `Peer (${Peers.url(peer)}) (like client on ${hostname}:${port}) `;
    return `Peer (${Peers.url(peer)}) `;
  }
  return 'Peer';
}

export type AdditionalArgs = {
  peer: Peer;
  peerServerManager: PeerServerManager;
};
