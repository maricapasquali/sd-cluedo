import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {v4 as uuid} from 'uuid';
import {tokensManager} from '../../helper';

const should = shouldFunc();

type DeleteGameConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
  gamerInRound: string;
};
export default function ({
  axiosInstance,
  game,
  gamerInRound,
}: DeleteGameConfig): void {
  const forbiddenToken =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('401 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAME, {
        headers: {
          authorization: undefined,
        },
        urlParams: {
          id: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED))
      .then(done)
      .catch(done);
  });
  it('403 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAME, {
        headers: {
          authorization: forbiddenToken,
        },
        urlParams: {
          id: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
      .then(done)
      .catch(done);
  });
  it('404 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAME, {
        headers: {
          authorization: tokensManager[gamerInRound],
        },
        urlParams: {
          id: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });
  it('200 delete cluedo game', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAME, {
        headers: {
          authorization: tokensManager[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        const dGame = response.data;
        dGame.should.have.property('identifier').equal(game.identifier);
        done();
      })
      .catch(done);
  });
}
