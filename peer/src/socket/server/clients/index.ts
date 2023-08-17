import {Server, Socket} from 'socket.io';
import {SocketChecker} from '../../checker';
import {logger} from '@utils/logger';

export namespace Clients {
  /**
   * Retrieve all sockets from server.
   * @param server socket.io server.
   */
  export function all(server: Server): Socket[] {
    return [...server.sockets.adapter.nsp.sockets.values()];
  }

  /**
   * Retrieve all peers sockets from server.
   * @param server socket.io server.
   */
  export function peer(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    return connectedSocket.filter(s => SocketChecker.isPeer(s));
  }

  /**
   * Retrieve all clients (no peer) sockets from server.
   * @param server socket.io server.
   */
  export function real(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    const _peerSocket: Socket[] = peer(server);
    return connectedSocket.filter(
      s => !_peerSocket.map(ps => ps.id).includes(s.id)
    );
  }

  /**
   * Retrieve all gamers (of given game) sockets from server.
   * @param server socket.io server.
   * @param gameId identifier of game.
   */
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

  /**
   * Store the connected gamer information pulled from the _auth_ socket.
   * @param auth authorization information socket.
   */
  export function register(auth: {[key: string]: any}): void {
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

  /**
   * Make the '_disconnected_' field true for a given gamer (defined by the given _auth_ socket).
   * @param auth authorization information socket.
   */
  export function unregister(auth: {[key: string]: any}): void {
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

  /**
   * Check if a given gamer (defined by the given _auth_ socket) is disconnected.
   * @param auth authorization information socket.
   */
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

  /**
   * Remove from storage the connected gamer information pulled from the _auth_ socket.
   * @param auth authorization information socket.
   */
  export function remove(auth: {[key: string]: any}): void {
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
