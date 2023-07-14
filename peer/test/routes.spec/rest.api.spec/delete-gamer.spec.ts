import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

type DeleteGamerConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
};
export default function ({axiosInstance, game}: DeleteGamerConfig): void {
  it('200 delete gamer from cluedo game', done => {
    const index = game.gamers.length - 1;
    const deletedGamer = game.gamers[index] || uuid();
    axiosInstance
      .delete(RestAPIRouteName.GAMER, {
        urlParams: {
          id: game.identifier,
          gamerId: deletedGamer.identifier,
        },
      })
      .then(response => {
        response.status.should.equal(ResponseStatus.OK);
        const dGamer = response.data;
        dGamer.should.deep.equal(deletedGamer);
        game.gamers.splice(index, 1);
        done();
      })
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
}
