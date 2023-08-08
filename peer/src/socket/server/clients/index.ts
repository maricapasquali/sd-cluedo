import {Server, Socket} from 'socket.io';
import {SocketChecker} from '../../checker';
import {logger} from '@utils/logger';

export function sids(sockets: Socket[]): string[] {
  return sockets.map(s => s.id);
}

export namespace Clients {
  export function all(server: Server): Socket[] {
    return [...server.sockets.adapter.nsp.sockets.values()];
  }
  export function peer(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    return connectedSocket.filter(s => SocketChecker.isPeer(s));
  }

  export function real(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    const _peerSocket: Socket[] = peer(server);
    return connectedSocket.filter(s => !sids(_peerSocket).includes(s.id));
  }
  export function gamer(server: Server, gameId: string): Socket[] {
    return real(server).filter(
      s => SocketChecker.isGamer(s) && s.handshake.auth.gameId === gameId
    );
  }
}

export namespace GamersSocket {
  type DisconnectedGamer = {
    gameId: string;
    gamerId: string;
    accessToken?: string;
    disconnected?: true;
  };
  const disconnectedGamersClients: DisconnectedGamer[] = [];
  export function register(auth: {[key: string]: any}) {
    const _auth = auth as DisconnectedGamer;
    const gamer = disconnectedGamersClients.find(
      i =>
        i.gamerId === _auth.gamerId &&
        i.gameId === _auth.gameId &&
        i.accessToken === _auth.accessToken
    );
    if (gamer) {
      delete gamer.disconnected;
    } else {
      disconnectedGamersClients.push(auth as DisconnectedGamer);
    }
    logger.info(`REGISTER gamer ${_auth.gamerId} of game ${_auth.gameId}`);
    logger.debug(disconnectedGamersClients);
  }
  export function unregister(auth: {[key: string]: any}) {
    const _auth = auth as DisconnectedGamer;
    const gamer = disconnectedGamersClients.find(
      i =>
        i.gamerId === _auth.gamerId &&
        i.gameId === _auth.gameId &&
        i.accessToken === _auth.accessToken
    );
    if (gamer) {
      gamer.disconnected = true;
      logger.info(`UNREGISTER gamer ${_auth.gamerId} of game ${_auth.gameId}`);
      logger.debug(disconnectedGamersClients);
    }
  }

  export function isUnregistered(auth: {[key: string]: any}): boolean {
    const _auth = auth as DisconnectedGamer;
    const gamer = disconnectedGamersClients.find(
      i =>
        i.gamerId === _auth.gamerId &&
        i.gameId === _auth.gameId &&
        i.accessToken === _auth.accessToken
    );
    return !!gamer?.disconnected;
  }

  export function remove(auth: {[key: string]: any}) {
    const _auth = auth as DisconnectedGamer;
    const gamerIndex = disconnectedGamersClients.findIndex(
      i =>
        i.gamerId === _auth.gamerId &&
        i.gameId === _auth.gameId &&
        i.accessToken === _auth.accessToken
    );
    if (gamerIndex > -1) {
      disconnectedGamersClients.splice(gamerIndex, 1);
      logger.info(`REMOVE gamer ${_auth.gamerId} of game ${_auth.gameId}`);
      logger.debug(disconnectedGamersClients);
    }
  }
}
