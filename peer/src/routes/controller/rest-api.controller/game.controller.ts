import {NextFunction, Request, Response} from 'express';
import {OkSender, ServerErrorSender} from '@utils/rest-api/responses';
import {catchMongooseNotFoundError, createTokenOf} from './utils';
import {getStartedCluedoGame} from '../../../utils';
import {GameManager} from '../../../managers/games';
import * as _ from 'lodash';
import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';
import {AppGetter} from '@utils/rest-api';
import {CluedoGameEvent} from '../../../socket/events';
import {Clients} from '../../../socket/server/clients';
import clientsSockets = Clients.real;
import gamersSockets = Clients.gamer;
import {PeerServerManager} from '../../../managers/peers-servers';

type ActionOptions = {
  req: Request;
  res: Response;
  next: NextFunction;
  gameId: string;
  gamer: string;
  gameManager: GameManager;
};
interface GamerManagerRequest {
  performAction(req: Request, res: Response, next: NextFunction): void;
}

abstract class AGamerManagerRequest implements GamerManagerRequest {
  performAction(req: Request, res: Response, next: NextFunction): void {
    const gameId = req.params.id;
    const gamer = req.query.gamer as string;
    const gameManager = MongoDBGamesManager.gameManagers(gameId);
    this.performRealAction({
      req,
      res,
      next,
      gameId,
      gamer,
      gameManager,
    });
  }

  protected abstract performRealAction(options: ActionOptions): void;
}

export const StartGameRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gamer,
      gameManager,
      gameId,
    }: ActionOptions): void {
      gameManager
        .startGame()
        .then(startedGame => {
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_START.action(
                  startedGame.identifier
                ),
                startedGame as CluedoGameMessage
              );
            });
            clientsSockets(serverIo)
              .filter(s => s.handshake.auth.gamerId !== gamer)
              .forEach(s => {
                const _startedGamed = getStartedCluedoGame(
                  startedGame,
                  s.handshake.auth.gamerId
                );
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_START.action(gameId),
                  _startedGamed as CluedoGameMessage
                );
              });
          }
          const _startedGamed = getStartedCluedoGame(startedGame, gamer);
          return OkSender.json(res, _startedGamed);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const RollDieRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
      gamer,
      gameId,
    }: ActionOptions): void {
      gameManager
        .rollDie()
        .then(housePart => {
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
              ...gamersSockets(serverIo, gameId).filter(
                s => s.handshake.auth.gamerId !== gamer
              ),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_ROLL_DIE.action(gameId),
                {
                  gamer,
                  housePart,
                } as RollDiceMessage
              );
            });
          }
          return OkSender.text(res, housePart);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const TakeNotes: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
      gameId,
      gamer,
    }: ActionOptions): void {
      const notes: Notes = req.body;
      gameManager
        .takeNote(gamer, notes)
        .then(added => {
          if (added) {
            const serverIo = AppGetter.socketServer(req);
            if (serverIo) {
              [
                ...PeerServerManager.from(req).sockets(),
                ...Clients.peer(serverIo),
              ].forEach(s => {
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_TAKE_NOTES.action(
                    gameId
                  ),
                  {gamer: gamer, note: notes} as TakeNotesMessage
                );
              });
            }
            return OkSender.text(res, 'Take notes performed');
          } else {
            return ServerErrorSender.json(res, {
              message: 'Take notes not performed',
            });
          }
        })
        .catch(next);
    }
  })();

export const EndRoundRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gamer,
      gameManager,
      gameId,
    }: ActionOptions): void {
      gameManager
        .passRoundToNext(gamer)
        .then(nextGamer => {
          if (nextGamer) {
            const serverIo = AppGetter.socketServer(req);
            if (serverIo) {
              [
                ...PeerServerManager.from(req).sockets(),
                ...Clients.peer(serverIo),
                ...gamersSockets(serverIo, gameId).filter(
                  s => s.handshake.auth.gamerId !== gamer
                ),
              ].forEach(s => {
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_END_ROUND.action(
                    gameId
                  ),
                  nextGamer
                );
              });
            }
            return OkSender.text(res, nextGamer);
          } else {
            return ServerErrorSender.json(res, {
              message: 'Pass round is not performed',
            });
          }
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const MakeAssumptionRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
      gamer,
      gameId,
    }: ActionOptions): void {
      const suggestion: Suggestion = req.body;
      gameManager
        .makeAssumption(suggestion)
        .then(added => {
          if (added) {
            const serverIo = AppGetter.socketServer(req);
            if (serverIo) {
              [
                ...PeerServerManager.from(req).sockets(),
                ...Clients.peer(serverIo),
                ...gamersSockets(serverIo, gameId).filter(
                  s => s.handshake.auth.gamerId !== gamer
                ),
              ].forEach(s => {
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(
                    gameId
                  ),
                  {
                    gamer,
                    suggestion,
                  } as SuggestionMessage
                );
              });
            }

            return OkSender.json(res, suggestion);
          } else {
            return ServerErrorSender.json(res, {
              message: 'Make assumption is not performed',
            });
          }
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const ConfutationRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gamer,
      gameId,
    }: ActionOptions): void {
      const card: string = req.body;
      const serverIo = AppGetter.socketServer(req);
      if (serverIo) {
        MongoDBGamesManager.gameManagers(gameId)
          .game()
          .then(game => {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(
                  gameId
                ),
                {
                  refuterGamer: gamer,
                  roundGamer: game.roundGamer,
                  card,
                } as ConfutationMessage
              );
            });
            gamersSockets(serverIo, gameId)
              .filter(s => s.handshake.auth.gamerId !== gamer)
              .forEach(s => {
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(
                    gameId
                  ),
                  {
                    refuterGamer: gamer,
                    roundGamer: game.roundGamer,
                    card:
                      s.handshake.auth.gamerId === game.roundGamer
                        ? card
                        : card.length > 0,
                  } as ConfutationMessage
                );
              });
          });
      }
      OkSender.json(res, {
        refuterGamer: gamer,
        card,
      });
    }
  })();
export const MakeAccusationRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
      gamer,
      gameId,
    }: ActionOptions): void {
      const suggestion: Suggestion = req.body;
      gameManager
        .makeAccusation(suggestion)
        .then(solution => {
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
              ...gamersSockets(serverIo, gameId).filter(
                s => s.handshake.auth.gamerId !== gamer
              ),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(
                  gameId
                ),
                {
                  gamer,
                  suggestion,
                  win: _.isEqual(suggestion, solution),
                } as AccusationMessage
              );
            });
          }

          return OkSender.json(res, {
            solution,
            win: _.isEqual(solution, suggestion),
          });
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const LeaveRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gamer,
      gameManager,
      gameId,
    }: ActionOptions): void {
      gameManager
        .leave(gamer)
        .then(gamers => {
          logger.debug(gamers);
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
              ...gamersSockets(serverIo, gameId).filter(
                s => s.handshake.auth.gamerId !== gamer
              ),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_LEAVE.action(gameId),
                {
                  gamer,
                  newDisposition: gamers.map(g => ({
                    gamer: g.identifier,
                    cards: g.cards || [],
                  })),
                } as LeaveMessage
              );
            });
          }

          return OkSender.text(res, gamer);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const StayRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameId,
      gameManager,
      gamer,
    }: ActionOptions): void {
      gameManager
        .silentGamerInRound()
        .then(sGamer => {
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
              ...gamersSockets(serverIo, gameId).filter(
                s => s.handshake.auth.gamerId !== gamer
              ),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_STAY.action(gameId),
                {
                  gamer,
                  roles: sGamer.role,
                } as StayGamerMessage
              );
            });
          }

          const token: string = createTokenOf(req, sGamer, gameId, true);
          return OkSender.json(
            res.header('x-access-token', ['Bearer', token].join(' ')),
            sGamer.role
          );
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const UseSecretPassageRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
      gameId,
      gamer,
    }: ActionOptions): void {
      gameManager
        .useSecretPassage()
        .then(housePart => {
          const serverIo = AppGetter.socketServer(req);
          if (serverIo) {
            [
              ...PeerServerManager.from(req).sockets(),
              ...Clients.peer(serverIo),
              ...gamersSockets(serverIo, gameId).filter(
                s => s.handshake.auth.gamerId !== gamer
              ),
            ].forEach(s => {
              s.emit(
                CluedoGameEvent.GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(
                  gameId
                ),
                {
                  gamer,
                  room: housePart,
                } as ToRoomMessage
              );
            });
          }
          return OkSender.text(res, housePart);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const StopGameRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameId,
      gameManager,
      gamer,
    }: ActionOptions): void {
      gameManager
        .stopGame()
        .then(stopped => {
          if (stopped) {
            const serverIo = AppGetter.socketServer(req);
            if (serverIo) {
              [
                ...PeerServerManager.from(req).sockets(),
                ...Clients.peer(serverIo),
                ...Clients.gamer(serverIo, gameId).filter(
                  s => s.handshake.auth.gamerId !== gamer
                ),
              ].forEach(s => {
                s.emit(
                  CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(
                    gameId
                  ),
                  gameId
                );
              });
            }
            return OkSender.text(res, gameId);
          } else {
            return ServerErrorSender.json(res, {
              message: 'Stop game is not performed',
            });
          }
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();
