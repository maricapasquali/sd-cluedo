import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {CluedoGames} from '@model';
import {should as shouldFunc} from 'chai';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';

const should = shouldFunc();

type GetGameConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
};
export default function ({axiosInstance, game}: GetGameConfig): void {
  it('200 cluedo game', done => {
    axiosInstance
      .get(RestAPIRouteName.GAME, {
        urlParams: {
          id: game.identifier,
        },
        params: {
          status: CluedoGames.Status.WAITING,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        const singleGame = response.data;
        singleGame.should.have.property('identifier').equal(game.identifier);
        singleGame.should.have
          .property('status')
          .equal(CluedoGames.Status.WAITING);
        done();
      })
      .catch(done);
  });
  it('400 error', done => {
    axiosInstance
      .get(RestAPIRouteName.GAME, {
        urlParams: {
          id: game.identifier,
        },
        params: {
          status: 'wait',
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });
  it('404 error', done => {
    axiosInstance
      .get(RestAPIRouteName.GAME, {
        urlParams: {
          id: game.identifier,
        },
        params: {
          status: CluedoGames.Status.STARTED,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });
}
