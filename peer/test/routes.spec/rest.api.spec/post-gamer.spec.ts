import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes/routesNames';
import {v4 as uuid} from 'uuid';
import {GamerElements} from '@model';
import {should as shouldFunc} from 'chai';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {gamersAuthenticationTokens, games} from '../../helper';
import {logger} from '@utils/logger';

const should = shouldFunc();

type PostGamerConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: PostGamerConfig): void {
  const gamer: Gamer = {
    identifier: uuid(),
    username: 'jake-green',
    characterToken: GamerElements.CharacterName.COLONEL_MUSTARD,
  };
  let game: CluedoGame;

  before(() => {
    game = games[0];
  });

  it('404 error (game not found)', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMERS, gamer, {
        urlParams: {
          id: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  it('201 add gamer in cluedo game', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMERS, gamer, {
        urlParams: {
          id: game.identifier,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.CREATED);
        const accessToken = response.headers['x-access-token'] as string;
        should.exist(accessToken);
        accessToken.should.contain('Bearer');
        const newGamer = response.data;
        logger.debug(newGamer);
        should.exist(newGamer);
        newGamer.should.have.property('identifier').equal(gamer.identifier);
        newGamer.should.have.property('username').equal(gamer.username);
        newGamer.should.have
          .property('characterToken')
          .equal(gamer.characterToken);
        game.gamers.push(newGamer);
        gamersAuthenticationTokens[gamer.identifier] = accessToken;
        done();
      })
      .catch(done);
  });

  describe('400 error', () => {
    it('No conform body', done => {
      axiosInstance
        .post(
          RestAPIRouteName.GAMERS,
          {...gamer, characterToken: 'mr. smith'},
          {
            urlParams: {
              id: game.identifier,
            },
          }
        )
        .then(done)
        .catch(err =>
          handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
        )
        .then(done)
        .catch(done);
    });
    it('Character token already taken', done => {
      axiosInstance
        .post(
          RestAPIRouteName.GAMERS,
          {
            identifier: uuid(),
            username: 'antony-yellow',
            characterToken: GamerElements.CharacterName.MISS_SCARLET,
          },
          {
            urlParams: {
              id: game.identifier,
            },
          }
        )
        .then(done)
        .catch(err =>
          handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST)
        )
        .then(done)
        .catch(done);
    });
  });
}
