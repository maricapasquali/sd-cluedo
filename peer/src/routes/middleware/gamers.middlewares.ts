import {NextFunction, Request, Response} from 'express';
import {
  AppGetter,
  catchableHandlerRequestPromise,
  HeadersFormatter,
} from '@utils/rest-api';
import * as Checkers from '@model/checker';
import {
  BadRequestSender,
  ForbiddenSender,
  GoneSender,
  NotFoundSender,
  UnauthorizedSender,
} from '@utils/rest-api/responses';
import {ValidationError} from 'runtypes';
import {MongoDBGamesManager} from '../../managers/games/mongoose';
import {CluedoGame} from '@model';
import {BasicTokenManager} from '@utils/tokens-manager/basic';

export function handlerBadRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const participant = req.body;
  catchableHandlerRequestPromise(() => {
    try {
      Checkers.CGamer.check(participant);
    } catch (err: any) {
      return BadRequestSender.json(res, {
        message: 'body is not a gamer instance',
        cause: (err as ValidationError).details,
      });
    }
    return;
  })
    .then(() => MongoDBGamesManager.gameManagers(req.params.id).game())
    .then(game => {
      if (
        game?.gamers.find(
          g =>
            g.identifier !== participant.identifier &&
            g.characterToken === participant.characterToken
        )
      ) {
        BadRequestSender.json(res, {
          message: 'character token is already assigned to other gamer.',
        });
      } else {
        next();
      }
    })
    .catch(next);
}

export function handlerNotFoundRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .findGamer(req.params.gamerId)
    .then(gamer =>
      gamer
        ? next()
        : NotFoundSender.json(res, {
            message: `Gamer ${req.params.gamerId} in game ${req.params.id} is not found`,
          })
    )
    .catch(next);
}
export function handlerUnauthorizedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return UnauthorizedSender.json(res, {
        message: 'Missing header "authorization"',
      });
    }
    const {scheme, parameters} = HeadersFormatter.authorization(req);
    if (
      scheme !== 'Bearer' ||
      !AppGetter.tokensManger(req).checker(parameters)
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
  catchableHandlerRequestPromise(() => {
    const {accessToken} = res.locals;
    const gamerId = req.params.gamerId;
    const payload = (AppGetter.tokensManger(req) as BasicTokenManager).decode(
      gamerId,
      accessToken
    );
    if (!payload) {
      return ForbiddenSender.json(res, {
        message: 'bearer token is not of gamer with identifier' + gamerId,
      });
    }
    if (payload.gameId !== req.params.id) {
      return ForbiddenSender.json(res, {
        message: `bearer token is not valid for this game ${req.params.id}`,
      });
    }
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerGoneRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .game({status: CluedoGame.Status.WAITING})
    .then(() => next())
    .catch(err => {
      if (err) {
        GoneSender.json(res, {
          message: `Game ${req.params.id} has already started or finished`,
        });
      } else next(err);
    });
}
