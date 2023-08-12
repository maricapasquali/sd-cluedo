import {CluedoGames, Gamers, Peers} from '@model';
import _gameHandlers from './game.handlers';
import {Clients} from '../../server/clients';
import {Server, Socket as PeerClient} from 'socket.io';
import {CluedoGameEvent} from '../../events';
import {logger} from '@utils/logger';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {MongoDBGamesManager} from '../../../managers/games/mongoose';

export * as gameActionsHandlers from './game.actions';
export const registerGameEventHandlers = _gameHandlers;

function callbackAfterSaveGame(
  server: Server
): (
  newGame: CluedoGame,
  removedGamers: Gamer[],
  oldRoundGamer: string
) => void {
  return (
    newGame: CluedoGame,
    removedGamers: Gamer[],
    oldRoundGamer: string
  ) => {
    if ((newGame.status as CluedoGames.Status) === CluedoGames.Status.WAITING) {
      removedGamers.forEach(gm => {
        Clients.real(server).forEach(s =>
          s.emit(CluedoGameEvent.CLUEDO_REMOVE_GAMER, {
            game: newGame.identifier,
            gamer: gm.identifier,
          } as ExitGamerMessage)
        );
      });
    } else {
      removedGamers.forEach(gm => {
        Clients.gamer(server, newGame.identifier).forEach(s => {
          const _leaveMessage: LeaveMessage = {
            gamer: gm.identifier,
            newDisposition: newGame.gamers
              .map(g => ({
                gamer: g.identifier,
                cards: g.cards || [],
              }))
              .filter(
                nD => nD.gamer === (s as PeerClient).handshake.auth.gamerId
              ),
          };
          s.emit(
            GameActionEvent.CLUEDO_LEAVE.action(newGame.identifier),
            _leaveMessage
          );
        });

        if (gm.identifier === oldRoundGamer) {
          const message =
            newGame.gamers.filter(gm =>
              gm.role?.includes(Gamers.Role.PARTICIPANT)
            ).length <= 1
              ? newGame.solution
              : newGame.roundGamer;
          Clients.gamer(server, newGame.identifier).forEach(s =>
            s.emit(
              GameActionEvent.CLUEDO_END_ROUND.action(newGame.identifier),
              message
            )
          );
        }
      });

      if (
        (newGame.status as CluedoGames.Status) === CluedoGames.Status.FINISHED
      ) {
        Clients.real(server).forEach(s =>
          s.emit(
            GameActionEvent.CLUEDO_STOP_GAME.action(newGame.identifier),
            newGame
          )
        );
      }
    }
  };
}

export function onDisconnection(auth: Peer | string, server: Server): void {
  const url = typeof auth === 'string' ? auth : Peers.url(auth);
  MongoDBGamesManager.removeGamersOf(url, callbackAfterSaveGame(server))
    .then(res => {
      res.forEach(g => {
        logger.info(
          `All gamers of offline peers ${url} are removed from game ${g.identifier}.`
        );
      });
    })
    .catch(err => {
      //VersionError: it should only happen during testing
      if (err.name !== 'VersionError') {
        logger.error(err);
      }
    });
}
