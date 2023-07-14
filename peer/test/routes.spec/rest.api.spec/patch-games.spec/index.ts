import {AxiosInstance, AxiosResponse} from 'axios';
import {RestAPIRouteName} from '../../../../src/routes';
import {QueryParameters} from '../../../../src/routes/parameters';
import {tokensManager} from '../../../helper';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGames, Gamers, GamerElements} from '@model';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import * as _ from 'lodash';
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;

const should = shouldFunc();

type PatchGameConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
  gamerInRound: string;
};
export default function ({
  axiosInstance,
  game,
  gamerInRound,
}: PatchGameConfig): void {
  it('400 error', done => {
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED))
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  describe('200 perform action', () => {
    function performActionInRound(
      action: string,
      payload?: object | string
    ): Promise<AxiosResponse> {
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
          response.status.should.equal(ResponseStatus.OK);
          return response;
        });
    }

    it(QueryParameters.Action.START_GAME + ' action', done => {
      performActionInRound(QueryParameters.Action.START_GAME)
        .then(response => {
          const startedGame = response.data;
          should.exist(startedGame);
          startedGame.should.have
            .property('status')
            .equal(CluedoGames.Status.STARTED);
          startedGame.should.have.property('solution').not.undefined;
          const dealCard = _.flatten(
            startedGame.gamers.map((g: Gamer) => g.cards)
          );
          dealCard.should.not.empty;
          dealCard.should.have.lengthOf(18);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.ROLL_DIE + ' action', done => {
      performActionInRound(QueryParameters.Action.ROLL_DIE)
        .then(response => {
          response.data.should.to.be.a('string');
          response.data.should.oneOf([
            ...Object.values(GamerElements.RoomName),
            ...Object.values(GamerElements.LobbyName),
          ]);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.END_ROUND + ' action', done => {
      performActionInRound(QueryParameters.Action.END_ROUND)
        .then(response => {
          response.data.should.to.be.a('string');
          const positionActualGamer = game.gamers.findIndex(
            g => g.identifier === gamerInRound
          );
          const positionNextGamer =
            (positionActualGamer + 1) % game.gamers.length;
          response.data.should.equal(game.gamers[positionNextGamer].identifier);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.MAKE_ASSUMPTION + ' action', done => {
      const assumption: Suggestion = {
        character: GamerElements.CharacterName.MISS_SCARLET,
        weapon: GamerElements.WeaponName.CANDLESTICK,
        room: GamerElements.RoomName.LIVING_ROOM,
      };
      performActionInRound(QueryParameters.Action.MAKE_ASSUMPTION, assumption)
        .then(response => {
          response.data.should.deep.equal(assumption);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.CONFUTATION_ASSUMPTION + ' action', done => {
      performActionInRound(
        QueryParameters.Action.CONFUTATION_ASSUMPTION,
        GamerElements.RoomName.LIVING_ROOM
      )
        .then(response => {
          const message = response.data;
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
      performActionInRound(QueryParameters.Action.MAKE_ASSUMPTION, accusation)
        .then(response => {
          const message = response.data;
          message.should.have.property('win').to.be.a('boolean');
          if (message.win) {
            message.should.have.property('solution').deep.equal(accusation);
          } else {
            message.should.have.property('solution').deep.not.equal(accusation);
          }
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.LEAVE + ' action', done => {
      performActionInRound(QueryParameters.Action.LEAVE)
        .then(response => {
          response.data.should.to.be.a('string');
          response.data.should.equal(gamerInRound);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.STAY + ' action', done => {
      performActionInRound(QueryParameters.Action.STAY)
        .then(response => {
          const accessToken = response.headers['x-access-token'] as string;
          should.exist(accessToken);
          accessToken.should.be.contains('Bearer');
          response.data.should.to.be.a('array');
          response.data.should.contains(Gamers.Role.SILENT);
          done();
        })
        .catch(done);
    });
    it(QueryParameters.Action.USE_SECRET_PASSAGE + ' action', done => {
      performActionInRound(QueryParameters.Action.USE_SECRET_PASSAGE)
        .then(response => {
          response.data.should.to.be.a('string');
          response.data.should.oneOf(Object.keys(RoomWithSecretPassage));
          done();
        })
        .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
        .then(done)
        .catch(done);
    });
    it(QueryParameters.Action.STOP_GAME + ' action', done => {
      performActionInRound(QueryParameters.Action.STOP_GAME)
        .then(response => {
          response.data.should.to.be.a('string');
          response.data.should.equal(game.identifier);
          done();
        })
        .catch(done);
    });
  });
}
