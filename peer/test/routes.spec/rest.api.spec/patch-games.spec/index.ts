import gamerActionsSpec from './gamer-actions.spec';

import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../../src/routes/routesNames';
import {QueryParameters} from '../../../../src/routes/parameters';
import {gamersAuthenticationTokens, games} from '../../../helper';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGame, GameElements} from '@model';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../../src/managers/games/mongoose';
import {CluedoGameModel} from '../../../../src/managers/games/mongoose/schemas';
import Action = QueryParameters.Action;

const should = shouldFunc();

type PatchGameConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: PatchGameConfig): void {
  let game: CluedoGame;
  let gamerInRound: string;

  before(done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, {
        identifier: uuid(),
        username: 'lollo',
        characterToken: GameElements.CharacterName.REVEREND_GREEN,
      } as Gamer)
      .then(response => {
        game = response.data;
        games.push(game);
        gamerInRound = game.gamers[0].identifier;

        gamersAuthenticationTokens[game.gamers[0].identifier] =
          response.headers['x-access-token'];
        return axiosInstance.post(
          RestAPIRouteName.GAMERS,
          {
            identifier: uuid(),
            username: 'cicco',
            characterToken: GameElements.CharacterName.MRS_PEACOCK,
          },
          {
            urlParams: {
              id: game.identifier,
            },
          }
        );
      })
      .then(response => {
        game.gamers.push(response.data);
        gamersAuthenticationTokens[response.data.identifier] =
          response.headers['x-access-token'];

        return axiosInstance.post(
          RestAPIRouteName.GAMERS,
          {
            identifier: uuid(),
            username: 'anna#1',
            characterToken: GameElements.CharacterName.MRS_WHITE,
          },
          {
            urlParams: {
              id: game.identifier,
            },
          }
        );
      })
      .then(response => {
        game.gamers.push(response.data);
        gamersAuthenticationTokens[response.data.identifier] =
          response.headers['x-access-token'];

        done();
      })
      .catch(done);
  });

  describe('400 errors', () => {
    it('query parameters', done => {
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: gamersAuthenticationTokens[gamerInRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: 'start',
          },
        })
        .then(done)
        .catch(err =>
          handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
        )
        .then(done)
        .catch(done);
    });
    describe('body paramenters', () => {
      it(Action.MAKE_ASSUMPTION + ' action', done => {
        axiosInstance
          .patch(RestAPIRouteName.GAME, null, {
            headers: {
              authorization: gamersAuthenticationTokens[gamerInRound],
            },
            urlParams: {
              id: game.identifier,
            },
            params: {
              gamer: gamerInRound,
              action: Action.MAKE_ASSUMPTION,
            },
          })
          .then(done)
          .catch(err =>
            handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
          )
          .then(done)
          .catch(done);
      });
      it(Action.CONFUTATION_ASSUMPTION + ' action', done => {
        axiosInstance
          .patch(RestAPIRouteName.GAME, 'jake', {
            headers: {
              authorization: gamersAuthenticationTokens[gamerInRound],
              'content-type': 'text/plain',
            },
            urlParams: {
              id: game.identifier,
            },
            params: {
              gamer: gamerInRound,
              action: Action.CONFUTATION_ASSUMPTION,
            },
          })
          .then(done)
          .catch(err =>
            handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
          )
          .then(done)
          .catch(done);
      });
      it(Action.TAKE_NOTES + ' action', done => {
        axiosInstance
          .patch(RestAPIRouteName.GAME, null, {
            headers: {
              authorization: gamersAuthenticationTokens[gamerInRound],
            },
            urlParams: {
              id: game.identifier,
            },
            params: {
              gamer: gamerInRound,
              action: Action.TAKE_NOTES,
            },
          })
          .then(done)
          .catch(err =>
            handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
          )
          .then(done)
          .catch(done);
      });
    });
  });

  it('404 error', done => {
    axiosInstance
      .patch(RestAPIRouteName.GAME, null, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: uuid(),
        },
        params: {
          gamer: gamerInRound,
          action: QueryParameters.Action.START_GAME,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  describe('Authorized errors', () => {
    it('401 error', done => {
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: undefined,
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: QueryParameters.Action.START_GAME,
          },
        })
        .then(done)
        .catch(err =>
          handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED)
        )
        .then(done)
        .catch(done);
    });
    it('403 error', done => {
      const gamerNotINRound =
        game.gamers[game.gamers.length - 1]?.identifier || uuid();
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: gamersAuthenticationTokens[gamerNotINRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: QueryParameters.Action.START_GAME,
          },
        })
        .then(done)
        .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
        .then(done)
        .catch(done);
    });
  });

  describe('410 error', () => {
    before(done => {
      CluedoGameModel.updateOne(
        {identifier: game.identifier},
        {$set: {status: CluedoGame.Status.STARTED}}
      )
        .then(() => done())
        .catch(done);
    });
    it('some available action on started/finished game', done => {
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: gamersAuthenticationTokens[gamerInRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: Action.START_GAME,
          },
        })
        .then(done)
        .catch(err => handlerResponseErrorCheck(err, ResponseStatus.GONE))
        .then(done)
        .catch(done);
    });
    after(done => {
      CluedoGameModel.updateOne(
        {identifier: game.identifier},
        {$set: {status: CluedoGame.Status.WAITING}}
      )
        .then(() => done())
        .catch(done);
    });
  });

  describe('200 perform action', () => {
    gamerActionsSpec({axiosInstance});
  });

  after(done => {
    MongoDBGamesManager.getGames(CluedoGame.Status.FINISHED)
      .then(games => {
        logger.debug(games);
        games.should.be.a('array').not.empty;
        done();
      })
      .catch(done);
  });
}
