import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

type GetGamesConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: GetGamesConfig): void {
  it('200 list of cluedo game', done => {
    axiosInstance
      .get(RestAPIRouteName.GAMES)
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        const games = response.data;
        games.should.be.a('array').and.deep.contains(games[0]);
        done();
      })
      .catch(done);
  });
  it('400 error', done => {
    axiosInstance
      .get(RestAPIRouteName.GAMES, {
        params: {
          status: 'ending',
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });
}
