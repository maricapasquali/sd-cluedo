import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../../src/routes';
import {QueryParameters} from '../../../../src/routes/parameters';
import {tokensManager} from '../../../helper';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGames, GamerElements, Gamers} from '@model';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {logger} from '@utils/logger';
import {NotFoundError} from '../../../../src/managers/games/mongoose/errors';
import {MongoDBGamesManager} from '../../../../src/managers/games/mongoose';
import {CluedoGameModel} from '../../../../src/managers/games/mongoose/schemas';
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
import Action = QueryParameters.Action;

const should = shouldFunc();

type PatchGameConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: PatchGameConfig): void {
  let game: CluedoGame;
  let gamerInRound: string;

  function performActionInRound(action: string, payload?: object | string) {
    return axiosInstance
      .patch(RestAPIRouteName.GAME, payload, {
        headers: {
          authorization: tokensManager[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: action,
        },
      })
      .then(response => {
        logger.debug(response);
        response.status.should.equal(ResponseStatus.OK);
        return response;
      });
  }
  function nextGamer(): string {
    const positionActualGamer = game.gamers.findIndex(
      g => g.identifier === gamerInRound
    );
    const positionNextGamer = (positionActualGamer + 1) % game.gamers.length;
    return game.gamers[positionNextGamer].identifier;
  }

  before(done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, {
        identifier: uuid(),
        username: 'lollo',
        characterToken: GamerElements.CharacterName.REVEREND_GREEN,
      } as Gamer)
      .then(response => {
        game = response.data;
        tokensManager[game.gamers[0].identifier] =
          response.headers['x-access-token'];
        return axiosInstance.post(
          RestAPIRouteName.GAMERS,
          {
            identifier: uuid(),
            username: 'cicco',
            characterToken: GamerElements.CharacterName.MRS_PEACOCK,
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
        tokensManager[response.data.identifier] =
          response.headers['x-access-token'];

        return axiosInstance.post(
          RestAPIRouteName.GAMERS,
          {
            identifier: uuid(),
            username: 'anna#1',
            characterToken: GamerElements.CharacterName.MRS_WHITE,
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
        tokensManager[response.data.identifier] =
          response.headers['x-access-token'];

        gamerInRound = game.gamers[0].identifier;
        done();
      })
      .catch(done);
  });

  describe('400 errors', () => {
    it('query parameters', done => {
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: tokensManager[gamerInRound],
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
              authorization: tokensManager[gamerInRound],
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
              authorization: tokensManager[gamerInRound],
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
    });
  });

  it('404 error', done => {
    axiosInstance
      .patch(RestAPIRouteName.GAME, null, {
        headers: {
          authorization: tokensManager[gamerInRound],
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
            authorization: tokensManager[gamerNotINRound],
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
        {$set: {status: CluedoGames.Status.STARTED}}
      )
        .then(() => done())
        .catch(done);
    });
    it('some available action on started/finished game', done => {
      axiosInstance
        .patch(RestAPIRouteName.GAME, null, {
          headers: {
            authorization: tokensManager[gamerInRound],
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
        {$set: {status: CluedoGames.Status.WAITING}}
      )
        .then(() => done())
        .catch(done);
    });
  });

  describe('200 perform action', () => {
    const assumption: Suggestion = {
      character: GamerElements.CharacterName.MISS_SCARLET,
      weapon: GamerElements.WeaponName.CANDLESTICK,
      room: GamerElements.RoomName.LIVING_ROOM,
    };

    it(QueryParameters.Action.START_GAME + ' action', done => {
      performActionInRound(QueryParameters.Action.START_GAME)
        .then(response => {
          const startedGame = response.data;
          logger.debug(startedGame);
          should.exist(startedGame);
          startedGame.should.have
            .property('status')
            .equal(CluedoGames.Status.STARTED);
          startedGame.should.not.have.property('solution');
          startedGame.should.have.property('weapons').that.is.a('array').and.is
            .not.empty;
          startedGame.should.have.property('rooms').that.is.a('array').and.is
            .not.empty;
          startedGame.should.have.property('characters').that.is.a('array').and
            .is.not.empty;
          gamerInRound = startedGame.roundGamer;
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.ROLL_DIE + ' action', done => {
      performActionInRound(QueryParameters.Action.ROLL_DIE)
        .then(response => {
          response.headers['content-type'].should.contain('text/plain');
          response.data.should.be
            .a('string')
            .and.oneOf([
              ...Object.values(GamerElements.RoomName),
              ...Object.values(GamerElements.LobbyName),
            ]);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.MAKE_ASSUMPTION + ' action', done => {
      performActionInRound(QueryParameters.Action.MAKE_ASSUMPTION, assumption)
        .then(response => {
          response.data.should.deep.equal(assumption);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.CONFUTATION_ASSUMPTION + ' action', done => {
      const _nextGamerId = nextGamer();
      MongoDBGamesManager.gameManagers(game.identifier)
        .findGamer(_nextGamerId)
        .then(nextGamer => {
          if (!nextGamer) throw new Error(`Gamer ${_nextGamerId} not found`);
          if (!nextGamer.cards)
            throw new Error(`Gamer ${_nextGamerId} have no cards`);
          const card = nextGamer.cards.find(_card =>
            Object.values(assumption).includes(_card)
          );
          logger.debug(`Confutation card chosen is ${card}`);
          return axiosInstance.patch(RestAPIRouteName.GAME, card, {
            headers: {
              authorization: tokensManager[_nextGamerId],
              'content-type': 'text/plain',
            },
            urlParams: {
              id: game.identifier,
            },
            params: {
              gamer: _nextGamerId,
              action: QueryParameters.Action.CONFUTATION_ASSUMPTION,
            },
          });
        })
        .then(response => {
          response.status.should.equal(ResponseStatus.OK);
          const message = response.data;
          logger.debug(message);
          message.should.have.property('refuterGamer').to.be.a('string');
          message.should.satisfy((m: any) => {
            const type = typeof m.card;
            return type === 'string' || type === 'undefined' || m.card === null;
          }, 'Card type should to be string or undefined or null');
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.MAKE_ACCUSATION + ' action', done => {
      const accusation: Suggestion = {
        character: GamerElements.CharacterName.MRS_PEACOCK,
        weapon: GamerElements.WeaponName.LEAD_PIPE,
        room: GamerElements.RoomName.BALLROOM,
      };
      performActionInRound(QueryParameters.Action.MAKE_ACCUSATION, accusation)
        .then(response => {
          const message = response.data;
          logger.debug(message);
          message.should.have.property('win').that.is.a('boolean');
          if (message.win) {
            message.should.have.property('solution').deep.equal(accusation);
          } else {
            message.should.have.property('solution').deep.not.equal(accusation);
          }
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.USE_SECRET_PASSAGE + ' action', done => {
      performActionInRound(QueryParameters.Action.USE_SECRET_PASSAGE)
        .then(response => {
          logger.debug(response.data);
          response.headers['content-type'].should.contain('text/plain');
          response.data.should.be
            .a('string')
            .and.be.oneOf(Object.keys(RoomWithSecretPassage));
          done();
        })
        .catch(err => {
          const response = err?.response || {};
          if (
            (response.status as ResponseStatus) === ResponseStatus.NOT_FOUND &&
            response.data?.code === NotFoundError.NOT_FOUND_SECRET_PASSAGE
          ) {
            // gamer in round is not in room with secret passage
            done();
          } else {
            done(err);
          }
        });
    });
    it(QueryParameters.Action.STAY + ' action', done => {
      performActionInRound(QueryParameters.Action.STAY)
        .then(response => {
          const accessToken = response.headers['x-access-token'] as string;
          should.exist(accessToken);
          accessToken.should.contain('Bearer');
          response.data.should.be
            .a('array')
            .that.contain(Gamers.Role.SILENT)
            .and.not.contain(Gamers.Role.PARTICIPANT);

          const _roundGamer = game.gamers?.find(
            g => gamerInRound === g.identifier
          );
          if (_roundGamer) _roundGamer.role = response.data;
          tokensManager[gamerInRound] = accessToken;
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.LEAVE + ' action', done => {
      performActionInRound(QueryParameters.Action.LEAVE)
        .then(response => {
          response.headers['content-type'].should.contain('text/plain');
          response.data.should.be.a('string').and.equal(gamerInRound);
          game.gamers.splice(
            game.gamers.findIndex(g => g.identifier === gamerInRound),
            1
          );
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.END_ROUND + ' action', done => {
      performActionInRound(QueryParameters.Action.END_ROUND)
        .then(response => {
          logger.debug(response.data);
          response.headers['content-type'].should.contain('text/plain');
          response.data.should.be.a('string').and.equal(nextGamer());
          gamerInRound = response.data;
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.STOP_GAME + ' action', done => {
      performActionInRound(QueryParameters.Action.STOP_GAME)
        .then(response => {
          response.headers['content-type'].should.contain('text/plain');
          response.data.should.be.a('string').and.equal(game.identifier);
          done();
        })
        .catch(done);
    });

    after(done => {
      MongoDBGamesManager.getGames(CluedoGames.Status.FINISHED)
        .then(games => {
          logger.debug(games);
          games.should.be.a('array').not.empty;
          done();
        })
        .catch(done);
    });
  });
}
