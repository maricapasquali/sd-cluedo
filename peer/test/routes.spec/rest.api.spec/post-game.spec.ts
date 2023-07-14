import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes';
import {logger} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {GamerElements, CluedoGames} from '@model';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {tokensManager} from '../../helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

type PostGameConfig = {
  axiosInstance: AxiosInstance;
  game: CluedoGame;
};
export default function ({axiosInstance, game}: PostGameConfig): void {
  const creator: Gamer = {
    identifier: uuid(),
    username: 'mario03',
    characterToken: GamerElements.CharacterName.MISS_SCARLET,
  };

  it('400 error', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, creator)
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('409 error', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, [creator])
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.CONFLICT))
      .then(done)
      .catch(done);
  });

  it('201 create cluedo game (in waiting state)', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, [creator])
      .then(response => {
        response.status.should.equal(ResponseStatus.CREATED);
        const accessToken = response.headers['x-access-token'] as string;
        should.exist(accessToken);
        accessToken.should.be.contains('Bearer');
        const waitingGame = response.data;
        logger.debug(waitingGame);
        should.exist(waitingGame);
        waitingGame.should.have
          .property('status')
          .equal(CluedoGames.Status.WAITING);
        waitingGame.should.have.property('gamers').contains(creator);
        game = waitingGame;
        tokensManager[creator.identifier] = response.headers['x-access-token'];
        done();
      })
      .catch(done);
  });
}
