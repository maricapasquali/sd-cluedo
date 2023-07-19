import {Server, Socket} from 'socket.io';
import {logger} from '@utils/logger';

export namespace CluedoGameEvent {
  const prefix = 'cluedo';
  export const CLUEDO_NEW_GAME = prefix + '/new_game';
  export const CLUEDO_NEW_GAMER = prefix + '/new_gamer';
  export const CLUEDO_REMOVE_GAMER = prefix + '/remove_gamer';
  export class GameActionEvent {
    private _prefix = 'cluedo/:gameId';
    private _action: string;
    protected constructor(action: string) {
      this._action = this._prefix + '/' + action;
    }
    static readonly CLUEDO_START = new GameActionEvent('start_game');
    static readonly CLUEDO_ROLL_DICE = new GameActionEvent('roll_die');
    static readonly CLUEDO_END_ROUND = new GameActionEvent('end_round');
    static readonly CLUEDO_MAKE_ASSUMPTION = new GameActionEvent(
      'make_assumption'
    );
    static readonly CLUEDO_CONFUTATION_ASSUMPTION = new GameActionEvent(
      'confutation_assumption'
    );
    static readonly CLUEDO_MAKE_ACCUSATION = new GameActionEvent(
      'make_accusation'
    );
    static readonly CLUEDO_STOP_GAME = new GameActionEvent('stop_game');
    static readonly CLUEDO_LEAVE = new GameActionEvent('leave');
    static readonly CLUEDO_STAY = new GameActionEvent('stay');
    static readonly CLUEDO_USE_SECRET_PASSAGE = new GameActionEvent(
      'use_secret_passage'
    );
    static readonly CLUEDO_TAKE_NOTES = new GameActionEvent('take_notes');

    action(gameId: string): string {
      return this._action.replace(':gameId', gameId);
    }
  }
}

export namespace Clients {
  export function all(server: Server): Socket[] {
    return [...server.sockets.adapter.nsp.sockets.values()];
  }
  export function peer(server: Server): Socket[] {
    const connectedSocket: Socket[] = all(server);
    return connectedSocket.filter(s => s.handshake.auth.peerId);
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
}
export default function handlerSocket(socketServer: Server): void {
  socketServer.on('connection', (socket: Socket) => {
    logger.info('Socket ID = %s connects', socket.id);
    //TODO: emit to discovery server number of clients connected
    socket.on('disconnect', reason => {
      //TODO: emit to discovery server number of clients connected
      logger.info('Socket ID = %s disconnects. Reason = %s', socket.id, reason);
    });
  });
}
