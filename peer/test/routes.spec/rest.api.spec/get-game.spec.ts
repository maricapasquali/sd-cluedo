import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes/routesNames';
import {CluedoGame} from '@model';
import {should as shouldFunc} from 'chai';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {games} from '../../helper';
const should = shouldFunc();

type GetGameConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: GetGameConfig): void {
  let game: CluedoGame;
  before(() => {
    game = games[0];
  });

  it('200 cluedo game', done => {
    axiosInstance
      .get(RestAPIRouteName.GAME, {
        urlParams: {
          id: game.identifier,
        },
        params: {
          status: CluedoGame.Status.WAITING,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        const singleGame = response.data;
        singleGame.should.have.property('identifier').equal(game.identifier);
        singleGame.should.have
          .property('status')
          .equal(CluedoGame.Status.WAITING);
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
          status: CluedoGame.Status.STARTED,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });
}
