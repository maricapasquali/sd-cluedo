import {
  CreatedSender,
  OkSender,
  ServerErrorSender,
} from '@utils/rest-api/responses';
import {NextFunction, Request, Response} from 'express';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';
import {v4 as uuid} from 'uuid';
import {AppGetter, catchableHandlerRequestPromise} from '@utils/rest-api';
import {MongooseError} from 'mongoose';
import {QueryParameters} from '../../parameters';
import {catchMongooseNotFoundError, createTokenOf} from './utils';
import {
  ConfutationRequest,
  EndRoundRequest,
  LeaveRequest,
  MakeAccusationRequest,
  MakeAssumptionRequest,
  RollDieRequest,
  StartGameRequest,
  StayRequest,
  StopGameRequest,
  TakeNotes,
  UseSecretPassageRequest,
} from './game.controller';
import {CluedoGameEvent} from '../../../socket/events';
import {Clients} from '../../../socket/server/clients';
import {PeerServerManager} from '../../../managers/peers-servers';
import Action = QueryParameters.Action;
import {CluedoGame} from '@model';
import {getStartedCluedoGame} from '../../../utils';
import {logger} from '@utils/logger';

export function postGames(
  myPeer: Peer
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const _gamer: Gamer = {...req.body, device: myPeer};
    MongoDBGamesManager.createGame({
      identifier: uuid(),
      gamers: [_gamer],
    } as CluedoGame)
      .then(waitingGame => {
        logger.debug(`Add game ${JSON.stringify(waitingGame)}`);
        const socketIo = AppGetter.socketServer(req);
        if (socketIo) {
          [
            ...Clients.all(socketIo),
            ...PeerServerManager.from(req).sockets(),
          ].forEach(s => {
            s.emit(
              CluedoGameEvent.CLUEDO_NEW_GAME,
              waitingGame as CluedoGameMessage
            );
          });
        }
        return catchableHandlerRequestPromise(() => {
          const token: string = createTokenOf(
            req,
            waitingGame.gamers[0],
            waitingGame.identifier
          );
          return CreatedSender.json(
            res.header('x-access-token', ['Bearer', token].join(' ')),
            waitingGame
          );
        });
      })
      .catch(next);
  };
}

export function getGames(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isPeer = !!req.headers['x-peer-address'];
  MongoDBGamesManager.getGames(req.query.status as string)
    .then(games => {
      OkSender.json(
        res,
        isPeer
          ? games
          : games.map(g =>
              (g.status as CluedoGame.Status.STARTED) ===
              CluedoGame.Status.STARTED
                ? getStartedCluedoGame(g)
                : g
            )
      );
    })
    .catch(next);
}

export function getGame(req: Request, res: Response, next: NextFunction): void {
  catchableHandlerRequestPromise(() => {
    const {gamerId} = res.locals;
    const status = req.query.status as string;
    const gamer = req.query.gamer as string;
    const filters: {
      status?: string;
      gamer?: string;
    } = {};
    if (status) filters.status = status;
    if (gamer) filters.gamer = gamer;
    return MongoDBGamesManager.gameManagers(req.params.id)
      .game(Object.keys(filters).length > 0 ? filters : undefined)
      .then(game =>
        OkSender.json(
          res,
          (game.status as CluedoGame.Status.STARTED) ===
            CluedoGame.Status.STARTED
            ? getStartedCluedoGame(game.toObject(), gamerId)
            : game
        )
      )
      .catch((err: MongooseError) =>
        catchMongooseNotFoundError(err, res, next)
      );
  }).catch(next);
}

export function patchGame(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  switch (req.query.action as Action) {
    case Action.START_GAME:
      StartGameRequest.performAction(req, res, next);
      break;
    case Action.ROLL_DIE:
      RollDieRequest.performAction(req, res, next);
      break;
    case Action.END_ROUND:
      EndRoundRequest.performAction(req, res, next);
      break;
    case Action.MAKE_ASSUMPTION:
      MakeAssumptionRequest.performAction(req, res, next);
      break;
    case Action.CONFUTATION_ASSUMPTION:
      ConfutationRequest.performAction(req, res, next);
      break;
    case Action.MAKE_ACCUSATION:
      MakeAccusationRequest.performAction(req, res, next);
      break;
    case Action.LEAVE:
      LeaveRequest.performAction(req, res, next);
      break;
    case Action.STAY:
      StayRequest.performAction(req, res, next);
      break;
    case Action.USE_SECRET_PASSAGE:
      UseSecretPassageRequest.performAction(req, res, next);
      break;
    case Action.TAKE_NOTES:
      TakeNotes.performAction(req, res, next);
      break;
    case Action.STOP_GAME:
      StopGameRequest.performAction(req, res, next);
      break;
  }
}

export function postGamers(
  myPeer: Peer
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const _gamer: Gamer = {...req.body, device: myPeer};
    MongoDBGamesManager.gameManagers(req.params.id)
      .addGamer(_gamer)
      .then(gamer => {
        logger.debug(`add gamer ${JSON.stringify(gamer)}`);
        const socketIo = AppGetter.socketServer(req);
        if (socketIo) {
          [
            ...Clients.all(socketIo),
            ...PeerServerManager.from(req).sockets(),
          ].forEach(s => {
            s.emit(CluedoGameEvent.CLUEDO_NEW_GAMER, {
              game: req.params.id,
              gamer,
            } as GamerMessage);
          });
        }
        return catchableHandlerRequestPromise(() => {
          const token: string = createTokenOf(req, gamer, req.params.id);
          return CreatedSender.json(
            res.header('x-access-token', ['Bearer', token].join(' ')),
            gamer
          );
        });
      })
      .catch(next);
  };
}

export function deleteGamer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .removeGamer(req.params.gamerId)
    .then(removed => {
      return catchableHandlerRequestPromise(() => {
        if (removed) {
          const socketIo = AppGetter.socketServer(req);
          if (socketIo) {
            [
              ...Clients.all(socketIo),
              ...PeerServerManager.from(req).sockets(),
            ].forEach(s => {
              s.emit(CluedoGameEvent.CLUEDO_REMOVE_GAMER, {
                game: req.params.id,
                gamer: req.params.gamerId,
              } as ExitGamerMessage);
            });
          }
          AppGetter.tokensManger(req).removeToken(req.params.gamerId);
          return OkSender.text(res, req.params.gamerId);
        }
        return ServerErrorSender.json(res, {
          message: 'Gamer has not been removed',
        });
      });
    })
    .catch(next);
}
