import mongoose from 'mongoose';
import {MongoDBGamesManager} from '../../src/managers/games/mongoose';
import {v4 as uuid} from 'uuid';
import {Gamers, CluedoGames} from '@model';
import {logger} from '@utils/logger';
import {should as shouldFunc} from 'chai';
import gameManagerSpec from './game-manager.spec';
import {GamerElements} from '@model';

const should = shouldFunc();

describe('Games Manager', function () {
  this.timeout(10000);

  const mongodbURI: string =
    process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo-test';

  const creator: Gamer = {
    identifier: uuid(),
    username: 'mario03',
    characterToken: GamerElements.CharacterName.COLONEL_MUSTARD,
    device: {
      identifier: uuid(),
      hostname: 'pc mario',
      address: '192.168.1.3',
    },
  };

  let game: CluedoGame = {
    identifier: uuid(),
    gamers: [creator],
  };

  before(done => {
    mongoose
      .connect(mongodbURI)
      .then(iMongoose => iMongoose.connection.db?.dropDatabase())
      .then(() => done())
      .catch(done);
  });

  it('#createGame(..)', done => {
    MongoDBGamesManager.createGame(game)
      .then(cluedoGame => {
        logger.debug(cluedoGame);
        cluedoGame.should.have
          .property('identifier')
          .deep.equal(game.identifier);
        cluedoGame.gamers[0].should.have
          .property('role')
          .deep.equal([Gamers.Role.CREATOR, Gamers.Role.PARTICIPANT]);
        cluedoGame.should.have
          .property('status')
          .deep.equal(CluedoGames.Status.WAITING);
        game = cluedoGame;
        done();
      })
      .catch(done);
  });

  describe('#getGames(..)', () => {
    it('no filters', done => {
      MongoDBGamesManager.getGames()
        .then(cluedoGames => {
          logger.debug(cluedoGames);
          cluedoGames.map(g => g.identifier).should.contains(game.identifier);
          done();
        })
        .catch(done);
    });
    it('filter with status = started', done => {
      MongoDBGamesManager.getGames(CluedoGames.Status.STARTED)
        .then(cluedoGames => {
          logger.debug(cluedoGames);
          cluedoGames.should.have.lengthOf(0);
          done();
        })
        .catch(done);
    });
  });

  describe('#gameManagers(..)', () => {
    gameManagerSpec({game});
  });

  describe('#deleteGame(..)', () => {
    it('delete an existing cluedo game', done => {
      MongoDBGamesManager.deleteGame(game.identifier)
        .then(deleted => {
          logger.debug(deleted);
          deleted.should.be.true;
          done();
        })
        .catch(done);
    });
    it('no found cluedo game', done => {
      MongoDBGamesManager.deleteGame(uuid())
        .then(deleted => {
          logger.debug(deleted);
          deleted.should.be.false;
          done();
        })
        .catch(done);
    });
  });

  after(done => {
    mongoose.disconnect().then(done).catch(done);
  });
});
