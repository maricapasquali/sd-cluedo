import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {tokensManager} from '../../helper';

const should = shouldFunc();

type DeleteGamerConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
};
export default function ({axiosInstance, game}: DeleteGamerConfig): void {
  let index: number;
  let deletedGamer: Gamer;
  before(() => {
    index = 0; //game.gamers.length - 1;
    deletedGamer = game.gamers[index];
  });

  it('401 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAMER, {
        headers: {
          authorization: undefined,
        },
        urlParams: {
          id: game.identifier,
          gamerId: deletedGamer.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED))
      .then(done)
      .catch(done);
  });

  it('403 error', done => {
    const tokenForbidden = Object.entries(tokensManager).find(
      ([k]) => k !== deletedGamer.identifier
    );
    axiosInstance
      .delete(RestAPIRouteName.GAMER, {
        headers: {
          authorization: tokenForbidden ? tokenForbidden[1] : '',
        },
        urlParams: {
          id: game.identifier,
          gamerId: deletedGamer.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
      .then(done)
      .catch(done);
  });

  it('404 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAMER, {
        urlParams: {
          id: game.identifier,
          gamerId: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  it('200 delete gamer from cluedo game', done => {
    axiosInstance
      .delete(RestAPIRouteName.GAMER, {
        headers: {
          authorization: tokensManager[deletedGamer.identifier],
        },
        urlParams: {
          id: game.identifier,
          gamerId: deletedGamer.identifier,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        response.headers['content-type'].should.contain('text/plain');
        const dGamer = response.data;
        dGamer.should.be.a('string').and.equal(deletedGamer.identifier);
        game.gamers.splice(index, 1);
        done();
      })
      .catch(done);
  });
}
