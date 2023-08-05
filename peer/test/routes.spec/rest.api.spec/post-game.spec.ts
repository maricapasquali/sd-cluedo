import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '../../../src/routes/routesNames';
import {logger} from '@utils/logger';
import {v4 as uuid} from 'uuid';
import {GamerElements, CluedoGames} from '@model';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {gamersAuthenticationTokens, games} from '../../helper';
import {ResponseStatus} from '@utils/rest-api/responses';
import {should as shouldFunc} from 'chai';

const should = shouldFunc();

type PostGameConfig = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: PostGameConfig): void {
  const creator: Gamer = {
    identifier: uuid(),
    username: 'mario03',
    characterToken: GamerElements.CharacterName.MISS_SCARLET,
  };

  it('400 error', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, {identifier: uuid(), username: 'gina'})
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('201 create cluedo game (in waiting state)', done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, creator)
      .then(response => {
        response.status.should.equal(ResponseStatus.CREATED);
        const accessToken = response.headers['x-access-token'] as string;
        should.exist(accessToken);
        accessToken.should.contain('Bearer');
        const waitingGame = response.data;
        logger.debug(waitingGame);
        should.exist(waitingGame);
        waitingGame.should.have
          .property('status')
          .equal(CluedoGames.Status.WAITING);
        waitingGame.gamers.should.a('array').not.empty;
        waitingGame.gamers
          .map((g: Gamer) => g.identifier)
          .should.contain(creator.identifier);

        games.push(waitingGame);
        gamersAuthenticationTokens[creator.identifier] = accessToken;
        done();
      })
      .catch(done);
  });
}
