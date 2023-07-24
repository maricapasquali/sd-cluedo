import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {gamersAuthenticationTokens, games} from '../../helper';

const should = shouldFunc();

type DeleteGamerConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: DeleteGamerConfig): void {
  const indexDeletedGamer = 0;
  let game: CluedoGame;
  let deletedGamer: Gamer;

  before(() => {
    game = games[0];
    deletedGamer = game.gamers[indexDeletedGamer];
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
    const tokenForbidden = Object.entries(gamersAuthenticationTokens).find(
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
          authorization: gamersAuthenticationTokens[deletedGamer.identifier],
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
        game.gamers.splice(indexDeletedGamer, 1);
        done();
      })
      .catch(done);
  });
}
