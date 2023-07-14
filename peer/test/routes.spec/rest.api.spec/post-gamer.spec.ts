import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {v4 as uuid} from 'uuid';
import {GamerElements} from '@model';
import {should as shouldFunc} from 'chai';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {tokensManager} from '../../helper';

const should = shouldFunc();

type PostGamerConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
};
export default function ({axiosInstance, game}: PostGamerConfig): void {
  const gamer: Gamer = {
    identifier: uuid(),
    username: 'jake-green',
    characterToken: GamerElements.CharacterName.MISS_SCARLET,
  };

  it('400 error', done => {
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('404 error', done => {
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

  it('409 error', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMERS, gamer, {
        urlParams: {
          id: game.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.CONFLICT))
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
        accessToken.should.be.contains('Bearer');
        const newGamer = response.data;
        should.exist(newGamer);
        newGamer.should.have.property('identifier').equal(gamer.identifier);
        game.gamers.push(newGamer);
        tokensManager[newGamer.identifier] = response.headers['x-access-token'];
        done();
      })
      .catch(done);
  });
}
