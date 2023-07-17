import {NextFunction, Request, Response} from 'express';
import {RestAPIRouteName} from '../index';
import * as Checkers from '@model/checker';
import {
  BadRequestSender,
  ForbiddenSender,
  GoneSender,
  NotFoundSender,
  UnauthorizedSender,
} from '@utils/rest-api/responses';
import {ValidationError} from 'runtypes';
import {
  AppGetter,
  catchableHandlerRequestPromise,
  HeadersFormatter,
} from '@utils/rest-api';
import {CluedoGames, GamerElements, Gamers} from '@model';
import {logger} from '@utils/logger';
import {QueryParameters} from '../parameters';
import {MongoDBGamesManager} from '../../managers/games/mongoose';
import {NotFoundError} from '../../managers/games/mongoose/errors';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import Action = QueryParameters.Action;
import RoomName = GamerElements.RoomName;
import CharacterName = GamerElements.CharacterName;
import WeaponName = GamerElements.WeaponName;
import GameStatus = CluedoGames.Status;

export function handlerBadRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    logger.debug('Method = ' + req.method + ', Path = ' + req.path);
    if (req.method === 'POST' && req.path === RestAPIRouteName.GAMES) {
      logger.debug('[handlerBadRequest]: create new game');
      const creator = req.body;
      try {
        Checkers.CGamer.check(creator);
      } catch (err: any) {
        return BadRequestSender.json(res, {
          message: 'body is not a gamer instance',
          cause: (err as ValidationError).details,
        });
      }
    } else if (
      req.method === 'GET' &&
      req.path === RestAPIRouteName.GAMES &&
      req.query.status
    ) {
      logger.debug('[handlerBadRequest]: retrieve games with status');
      if (!Object.values(GameStatus).includes(req.query.status as GameStatus)) {
        return BadRequestSender.json(res, {
          message:
            'Game status is not valid. Available are ' +
            Object.values(GameStatus),
        });
      }
    } else if (
      req.method === 'GET' &&
      new RegExp(RestAPIRouteName.GAMES + '/.*').test(req.path)
    ) {
      logger.debug('[handlerBadRequest]: retrieve game');
      if (!Object.values(GameStatus).includes(req.query.status as GameStatus)) {
        return BadRequestSender.json(res, {
          message:
            'Game status is not valid. Available are ' +
            Object.values(GameStatus),
        });
      }
    } else if (
      req.method === 'PATCH' &&
      new RegExp(RestAPIRouteName.GAMES + '/.*').test(req.path)
    ) {
      logger.debug('[handlerBadRequest]: perform action');
      if (!(req.query.gamer && req.query.action)) {
        return BadRequestSender.json(res, {
          message: 'Query is not valid. Required gamer=...&action=...',
        });
      }
      const action = req.query.action as Action;
      if (!Object.values(Action).includes(action)) {
        return BadRequestSender.json(res, {
          message:
            'Action is not valid. Available are ' + Object.values(Action),
        });
      }
      if (
        action === Action.MAKE_ACCUSATION ||
        action === Action.MAKE_ASSUMPTION
      ) {
        const suggestion = req.body;
        try {
          Checkers.CSuggestion.check(suggestion);
        } catch (err: any) {
          return BadRequestSender.json(res, {
            message: 'body is not a suggestion instance',
            cause: (err as ValidationError).details,
          });
        }
      } else if (action === Action.CONFUTATION_ASSUMPTION) {
        if (!req.header('content-type')?.includes('text/plain')) {
          return BadRequestSender.json(res, {
            message: 'content-type must be text/plain',
          });
        }
        const possibleCards: string[] = [
          '',
          ...Object.values(RoomName),
          ...Object.values(CharacterName),
          ...Object.values(WeaponName),
        ];
        if (!possibleCards.includes(req.body)) {
          return BadRequestSender.json(res, {
            message: 'body is not an available string : ' + possibleCards,
          });
        }
      }
    }
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerNotFoundRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .game()
    .then(() => next())
    .catch(err => {
      if (err instanceof NotFoundError)
        NotFoundSender.json(res, {
          message: `Game ${req.params.id} is not found`,
        });
      else next(err);
    });
}

export function handlerUnauthorizedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const gamerId = req.query.gamer as string;
    const authorization = req.headers.authorization;
    if (!authorization) {
      return UnauthorizedSender.json(res, {
        message: 'Missing header "authorization"',
      });
    }
    const {scheme, parameters} = HeadersFormatter.authorization(req);
    if (
      scheme !== 'Bearer' ||
      !AppGetter.tokensManger(req).checker(gamerId, parameters)
    ) {
      return UnauthorizedSender.json(res, {
        message: 'token is not a bearer token or it is not valid',
      });
    }
    res.locals.accessToken = parameters;
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerForbiddenRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const {accessToken} = res.locals;
  const gameId = req.params.id;
  const gamerId = req.query.gamer as string;
  const action = req.query.action as Action;
  catchableHandlerRequestPromise(() => {
    const checkPath = new RegExp(RestAPIRouteName.GAMES + '/.*').test(req.path);
    if (req.method === 'PATCH' && checkPath) {
      const payload = (AppGetter.tokensManger(req) as BasicTokenManager).decode(
        gamerId,
        accessToken
      );
      logger.debug(payload);
      if (!payload) {
        return ForbiddenSender.json(res, {
          message: 'bearer token is not of gamer with identifier' + gamerId,
        });
      }
      if (payload.gameId !== gameId) {
        return ForbiddenSender.json(res, {
          message: `bearer token is not valid for this game ${req.params.id}`,
        });
      }
      const _availableActionForSilent: Action[] = [
        Action.CONFUTATION_ASSUMPTION,
        Action.LEAVE,
        Action.END_ROUND,
      ];
      if (
        payload.role.includes(Gamers.Role.SILENT) &&
        !_availableActionForSilent.includes(action)
      ) {
        return ForbiddenSender.json(res, {
          message:
            'You are a silent gamer. Available actions ' +
            _availableActionForSilent,
        });
      }
    }
    return;
  })
    .then(() => {
      return MongoDBGamesManager.gameManagers(gameId)
        .game({gamer: gamerId})
        .then(game => {
          if (action !== Action.START_GAME) {
            MongoDBGamesManager.gameManagers(gameId)
              .game({status: GameStatus.STARTED})
              .then(() =>
                MongoDBGamesManager.gameManagers(gameId).isInRound(gamerId)
              )
              .then(inRound => {
                if (inRound && action === Action.CONFUTATION_ASSUMPTION) {
                  ForbiddenSender.json(res, {
                    message:
                      "You can't perform this operation because you can't disprove your assumption",
                  });
                } else next();
              })
              .catch(err => {
                if (err instanceof NotFoundError) {
                  ForbiddenSender.json(res, {
                    message:
                      "You can't perform this operation because game is not started",
                  });
                } else next(err);
              });
          } else {
            if (!CluedoGames.checkNumberOfGamers(game)) {
              ForbiddenSender.json(res, {
                message: `You can't perform this operation because number of gamers are not in [${CluedoGames.MIN_GAMERS}, ${CluedoGames.MAX_GAMERS}] for game ${gameId}`,
              });
            } else next();
          }
        })
        .catch(err => {
          if (err instanceof NotFoundError) next();
          else next(err);
        });
    })
    .catch(next);
}

export function handlerGoneRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const action = req.query.action as Action;
  const filters = {
    status:
      action === Action.START_GAME ? GameStatus.WAITING : GameStatus.STARTED,
  };
  MongoDBGamesManager.gameManagers(req.params.id)
    .game(filters)
    .then(() => next())
    .catch(err => {
      if (err) {
        GoneSender.json(res, {
          message: `Game ${req.params.id} has already started or finished`,
        });
      } else next(err);
    });
}
