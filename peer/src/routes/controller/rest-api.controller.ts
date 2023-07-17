import {
  ForbiddenSender,
  NotFoundSender,
  ServerErrorSender,
} from '@utils/rest-api/responses';
import {NextFunction, Request, Response} from 'express';
import {MongoDBGamesManager} from '../../managers/games/mongoose';
import {v4 as uuid} from 'uuid';
import {CreatedSender, OkSender} from '@utils/rest-api/responses';
import {AppGetter, catchableHandlerRequestPromise} from '@utils/rest-api';
import {MongooseError} from 'mongoose';
import {
  NotFoundError,
  NotInRoundError,
} from '../../managers/games/mongoose/errors';
import {QueryParameters} from '../parameters';
import Action = QueryParameters.Action;
import * as _ from 'lodash';
import {logger} from '@utils/logger';
function createTokenOf(
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

function catchMongooseNotFoundError(
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

function getStartedCluedoGame(
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
export function postGames(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.createGame({
    identifier: uuid(),
    gamers: [req.body],
  } as CluedoGame)
    .then(waitingGame => {
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
}

export function getGames(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.getGames(req.query.status as string)
    .then(games => OkSender.json(res, games))
    .catch(next);
}

export function getGame(req: Request, res: Response, next: NextFunction): void {
  catchableHandlerRequestPromise(() => {
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
      .then(game => OkSender.json(res, game))
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
  const gameId = req.params.id;
  const gamer = req.query.gamer as string;
  const action = req.query.action as Action;
  const gameManager = MongoDBGamesManager.gameManagers(gameId);
  switch (action) {
    case Action.START_GAME:
      gameManager
        .startGame()
        .then(startedGame => {
          const _startedGamed = getStartedCluedoGame(startedGame, gamer);
          return OkSender.json(res, _startedGamed);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.ROLL_DIE:
      gameManager
        .rollDie()
        .then(housePart => {
          return OkSender.text(res, housePart);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.END_ROUND:
      gameManager
        .passRoundToNext(gamer)
        .then(nextGamer => {
          if (nextGamer) {
            return OkSender.text(res, nextGamer);
          } else {
            return ServerErrorSender.json(res, {
              message: 'Pass round is not performed',
            });
          }
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.MAKE_ASSUMPTION:
      {
        const suggestion: Suggestion = req.body;
        gameManager
          .makeAssumption(suggestion)
          .then(added => {
            if (added) {
              return OkSender.json(res, suggestion);
            } else {
              return ServerErrorSender.json(res, {
                message: 'Make assumption is not performed',
              });
            }
          })
          .catch(err => catchMongooseNotFoundError(err, res, next));
      }
      break;
    case Action.CONFUTATION_ASSUMPTION:
      {
        const card: string = req.body;
        OkSender.json(res, {
          refuterGamer: gamer,
          card,
        });
      }
      break;
    case Action.MAKE_ACCUSATION:
      {
        const suggestion: Suggestion = req.body;
        gameManager
          .makeAccusation(suggestion)
          .then(solution => {
            return OkSender.json(res, {
              solution,
              win: _.isEqual(solution, suggestion),
            });
          })
          .catch(err => catchMongooseNotFoundError(err, res, next));
      }
      break;
    case Action.LEAVE:
      gameManager
        .leave(gamer)
        .then(gamers => {
          logger.debug(gamers);
          return OkSender.text(res, gamer);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.STAY:
      gameManager
        .silentGamerInRound()
        .then(sGamer => {
          const token: string = createTokenOf(req, sGamer, gameId, true);
          return OkSender.json(
            res.header('x-access-token', ['Bearer', token].join(' ')),
            sGamer.role
          );
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.USE_SECRET_PASSAGE:
      gameManager
        .useSecretPassage()
        .then(housePart => OkSender.text(res, housePart))
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
    case Action.STOP_GAME:
      gameManager
        .stopGame()
        .then(stopped => {
          if (stopped) {
            return OkSender.text(res, gameId);
          } else {
            return ServerErrorSender.json(res, {
              message: 'Stop game is not performed',
            });
          }
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
      break;
  }
}

export function postGamers(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .addGamer(req.body)
    .then(gamer => {
      return catchableHandlerRequestPromise(() => {
        const token: string = createTokenOf(req, gamer, req.params.id);
        return CreatedSender.json(
          res.header('x-access-token', ['Bearer', token].join(' ')),
          gamer
        );
      });
    })
    .catch(next);
}

export function deleteGamer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  MongoDBGamesManager.gameManagers(req.params.id)
    .removeGamer(req.params.gamerId)
    .then(removed => {
      if (removed) {
        AppGetter.tokensManger(req).removeToken(req.params.gamerId);
        OkSender.text(res, req.params.gamerId);
      } else {
        ServerErrorSender.json(res, {
          message: 'Gamer has not been removed',
        });
      }
    })
    .catch(next);
}
