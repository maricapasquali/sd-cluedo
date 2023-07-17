import {NextFunction, Request, Response} from 'express';
import {OkSender, ServerErrorSender} from '@utils/rest-api/responses';
import {
  catchMongooseNotFoundError,
  createTokenOf,
  getStartedCluedoGame,
} from './utils';
import {GameManager} from '../../../managers/games';
import * as _ from 'lodash';
import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';

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
      res,
      next,
      gamer,
      gameManager,
    }: ActionOptions): void {
      gameManager
        .startGame()
        .then(startedGame => {
          const _startedGamed = getStartedCluedoGame(startedGame, gamer);
          return OkSender.json(res, _startedGamed);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const RollDieRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({res, next, gameManager}: ActionOptions): void {
      gameManager
        .rollDie()
        .then(housePart => {
          return OkSender.text(res, housePart);
        })
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const EndRoundRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      res,
      next,
      gamer,
      gameManager,
    }: ActionOptions): void {
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
    }
  })();

export const MakeAssumptionRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      req,
      res,
      next,
      gameManager,
    }: ActionOptions): void {
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
  })();

export const ConfutaionRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({req, res, next, gamer}: ActionOptions): void {
      const card: string = req.body;
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
    }: ActionOptions): void {
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
  })();

export const LeaveRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      res,
      next,
      gamer,
      gameManager,
    }: ActionOptions): void {
      gameManager
        .leave(gamer)
        .then(gamers => {
          logger.debug(gamers);
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
    }: ActionOptions): void {
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
    }
  })();

export const UseScretPassageRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({res, next, gameManager}: ActionOptions): void {
      gameManager
        .useSecretPassage()
        .then(housePart => OkSender.text(res, housePart))
        .catch(err => catchMongooseNotFoundError(err, res, next));
    }
  })();

export const StopGameRequest: GamerManagerRequest =
  new (class extends AGamerManagerRequest {
    protected performRealAction({
      res,
      next,
      gameId,
      gameManager,
    }: ActionOptions): void {
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
    }
  })();
