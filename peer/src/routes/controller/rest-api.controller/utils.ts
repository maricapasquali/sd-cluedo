import {NextFunction, Request, Response} from 'express';
import {AppGetter} from '@utils/rest-api';
import {
  NotFoundError,
  NotInRoundError,
} from '../../../managers/games/mongoose/errors';
import {ForbiddenSender, NotFoundSender} from '@utils/rest-api/responses';
import * as _ from 'lodash';

export function createTokenOf(
  req: Request,
  gamer: Gamer,
  gameId: string,
  recreate = false
): string {
  return AppGetter.tokensManger(req).createToken(
    gamer.identifier,
    {
      identifier: gamer.identifier,
      role: gamer.role,
      username: gamer.username,
      gameId: gameId,
    },
    recreate
  );
}

export function catchMongooseNotFoundError(
  err: any,
  res: Response,
  next: NextFunction
) {
  if (err instanceof NotFoundError) {
    NotFoundSender.json(res, {
      message: err.message,
      cause: err.stack,
      code: err.code,
    });
  } else if (err instanceof NotInRoundError) {
    ForbiddenSender.json(res, {
      message: err.message,
    });
  } else {
    next(err);
  }
}

export function getStartedCluedoGame(
  cluedoGame: CluedoGame,
  gamerInRound: string
): CluedoGame {
  const _clonedGame = _.cloneDeep(cluedoGame);
  delete _clonedGame.solution;
  _clonedGame.gamers
    .filter(g => g.identifier !== gamerInRound)
    .forEach(g => {
      delete g.cards;
      delete g.notes;
    });
  return _clonedGame;
}
