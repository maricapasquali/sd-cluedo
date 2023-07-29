import {CluedoGames, GamerElements, Gamers} from '@model';
import {QueryParameters} from '../../../../src/routes/parameters';
import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../../src/managers/games/mongoose';
import {RestAPIRouteName} from '../../../../src/routes/routesNames';
import {gamersAuthenticationTokens, games, nextGamer} from '../../../helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {NotFoundError} from '../../../../src/managers/games/mongoose/errors';
import {AxiosInstance} from 'axios';
import {should as shouldFunc} from 'chai';
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
const should = shouldFunc();

type PatchGameActionConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: PatchGameActionConfig): void {
  let gamerInRound: string;
  let game: CluedoGame;
  function performActionInRound(action: string, payload?: object | string) {
    return axiosInstance
      .patch(RestAPIRouteName.GAME, payload, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
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

  const assumption: Suggestion = {
    character: GamerElements.CharacterName.MISS_SCARLET,
    weapon: GamerElements.WeaponName.CANDLESTICK,
    room: GamerElements.RoomName.LIVING_ROOM,
  };

  before(() => {
    game = games[1];
    gamerInRound = game.roundGamer || game.gamers[0].identifier;
  });

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
        startedGame.should.have.property('rooms').that.is.a('array').and.is.not
          .empty;
        startedGame.should.have.property('characters').that.is.a('array').and.is
          .not.empty;
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
  it(QueryParameters.Action.TAKE_NOTES + ' action', done => {
    performActionInRound(QueryParameters.Action.TAKE_NOTES, {
      text: 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua.',
    })
      .then(response => {
        response.headers['content-type'].should.contain('text/plain');
        response.data.should.be.a('string');
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
    const _nextGamerId = nextGamer(game, gamerInRound);
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
            authorization: gamersAuthenticationTokens[_nextGamerId],
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
        gamersAuthenticationTokens[gamerInRound] = accessToken;
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
        response.data.should.be
          .a('string')
          .and.equal(nextGamer(game, gamerInRound));
        gamerInRound = response.data;
        done();
      })
      .catch(done);
  });
  it(QueryParameters.Action.STOP_GAME + ' action', done => {
    performActionInRound(QueryParameters.Action.STOP_GAME)
      .then(response => {
        response.data.should.have.property('gameId').equal(game.identifier);
        response.data.should.have.property('solution');
        done();
      })
      .catch(done);
  });
}
