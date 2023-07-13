import {MongoDBGamesManager} from '../../src/managers/games/mongoose';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {logger} from '@utils/logger';
import {Gamers, CluedoGames, GamerElements} from '@model';
import {GameManager} from '../../src/managers/games';
const should = shouldFunc();

type GameManagerOptions = {
  game: CluedoGame;
};
export default function ({game}: GameManagerOptions): void {
  const gamer: Gamer = {
    identifier: uuid(),
    username: 'antonio01',
    characterToken: {
      name: GamerElements.CharacterName.MISS_SCARLET,
    },
  };

  let gameManager: GameManager;
  let gamerInRound: Gamer;
  before(() => {
    gameManager = MongoDBGamesManager.gameManagers(game.identifier);
  });

  it('after create game, a game manager should have been generated for the created game', () => {
    gameManager.gameId.should.equal(game.identifier);
  });

  it('#addGamer(..)', done => {
    gameManager
      .addGamer(gamer)
      .then(newGamer => {
        logger.debug(newGamer);
        newGamer.should.have.property('identifier').equal(gamer.identifier);
        newGamer.should.have
          .property('role')
          .deep.equal([Gamers.Role.PARTICIPANT]);
        done();
      })
      .catch(done);
  });

  it('#findGamer(..)', done => {
    gameManager
      .findGamer(gamer.identifier)
      .then(fGamer => {
        logger.debug(fGamer);
        should.exist(fGamer);
        fGamer?.should.deep.equal(gamer);
        done();
      })
      .catch(done);
  });

  it('#removeGamer(..)', done => {
    gameManager
      .removeGamer(gamer.identifier)
      .then(deleted => {
        logger.debug(deleted);
        deleted.should.be.true;
        done();
      })
      .catch(done);
  });

  it('#startGame(..)', done => {
    Promise.all([
      gameManager.addGamer(gamer),
      gameManager.addGamer({
        identifier: uuid(),
        username: 'anna',
        characterToken: {
          name: GamerElements.CharacterName.MRS_PEACOCK,
        },
      }),
    ])
      .then(() => gameManager.startGame())
      .then(startedGame => {
        logger.debug(startedGame);
        should.exist(startedGame);
        startedGame.should.have
          .property('status')
          .equal(CluedoGames.Status.STARTED);
        startedGame.should.have.property('solution').not.undefined;
        startedGame.gamers.map(g => g.cards).should.not.contains(undefined);
        game = startedGame;
        gamerInRound =
          game.gamers.find(g => g.identifier === game.roundGamer) ||
          ({} as Gamer);
        done();
      })
      .catch(done);
  });

  it('#isInRound(..)', done => {
    gameManager
      .isInRound(gamerInRound.identifier)
      .then(isInRound => {
        logger.debug(isInRound);
        isInRound.should.be.true;
        done();
      })
      .catch(done);
  });

  it('#rollDie(..)', done => {
    const houseparts = [
      ...Object.values(GamerElements.RoomName),
      ...Object.values(GamerElements.LobbyName),
    ];
    gameManager
      .rollDie()
      .then(housePart => {
        logger.debug(housePart);
        housePart.should.have.property('name').be.deep.members(houseparts);
        done();
      })
      .catch(done);
  });

  describe('#moveCharacterTokenIn(..)', () => {
    it('when roll die', done => {
      const housePart = GamerElements.RoomName.BALLROOM;
      gameManager
        .moveCharacterTokenIn(housePart)
        .then(moved => {
          logger.debug(moved);
          moved.should.be.true;
          done();
        })
        .catch(done);
    });
    it('when gamer in round uses secret passage', done => {
      gameManager
        .moveCharacterTokenIn()
        .then(moved => {
          logger.debug(moved);
          moved.should.be.true;
          done();
        })
        .catch(done);
    });
    it('when gamer in round makes assumption that named character in room', done => {
      const assumption: Suggestion = {
        character: GamerElements.CharacterName.MISS_SCARLET,
        room: GamerElements.RoomName.DINING_ROOM,
        weapon: GamerElements.WeaponName.DAGGER,
      };
      gameManager
        .moveCharacterTokenIn(assumption.room, assumption.character)
        .then(moved => {
          logger.debug(moved);
          moved.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  it('#makeAssumption(..)', done => {
    const suggestion: Suggestion = {
      character: GamerElements.CharacterName.MISS_SCARLET,
      room: GamerElements.RoomName.DINING_ROOM,
      weapon: GamerElements.WeaponName.DAGGER,
    };
    gameManager
      .makeAssumption(suggestion)
      .then(updated => {
        logger.debug(updated);
        updated.should.be.true;
        done();
      })
      .catch(done);
  });

  describe('#takeNote(..)', () => {
    it('string note', done => {
      const text =
        'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua';
      gameManager
        .takeNote(gamer.identifier, text)
        .then(added => {
          logger.debug(added);
          added.should.be.true;
          done();
        })
        .catch(done);
    });
    it('structured note', done => {
      const notes: StructuedNoteItem = {
        name: GamerElements.RoomName.STUDY,
        suspectState: GamerElements.SuspectState.MAYBE,
      };
      gameManager
        .takeNote(gamer.identifier, notes)
        .then(added => {
          logger.debug(added);
          added.should.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('#makeAccusation(..)', () => {
    it('wrong accusation', done => {
      const suggestion: Suggestion = {
        character: GamerElements.CharacterName.MISS_SCARLET,
        room:
          Object.values(GamerElements.RoomName).find(
            r => game.solution?.room !== r
          ) || '',
        weapon: GamerElements.WeaponName.DAGGER,
      };
      gameManager
        .makeAccusation(suggestion)
        .then(sol => {
          logger.debug(sol);
          sol.should.be.not.deep.equal(suggestion);
          done();
        })
        .catch(done);
    });
    it('right accusation', done => {
      const gameSol = game.solution || ({} as Suggestion);
      gameManager
        .makeAccusation(gameSol)
        .then(sol => {
          logger.debug(sol);
          sol.should.be.deep.equal(gameSol);
          done();
        })
        .catch(done);
    });
  });

  it('#silentGamer(..)', done => {
    gameManager
      .silentGamerInRound()
      .then(newRole => {
        logger.debug(newRole);
        newRole.should.have.contains(Gamers.Role.SILENT);
        done();
      })
      .catch(done);
  });

  it('#reDealCardsTo(..)', done => {
    gameManager
      .reDealCardsTo()
      .then(newGamersDisposition => {
        logger.debug(newGamersDisposition);
        should.exist(newGamersDisposition);
        [...newGamersDisposition.map(g => g.cards)].should.have.members(
          gamerInRound.cards || []
        );
        done();
      })
      .catch(done);
  });

  it('#passRoundToNext(..)', done => {
    const nextToGamer = gamer.identifier;
    gameManager
      .passRoundToNext()
      .then(newRoundGamer => {
        logger.debug(newRoundGamer);
        should.exist(newRoundGamer);
        newRoundGamer?.should.equals(nextToGamer);
        done();
      })
      .catch(done);
  });

  it('#stopGame(..)', done => {
    gameManager
      .stopGame()
      .then(stopped => {
        logger.debug(stopped);
        stopped.should.be.true;
        done();
      })
      .catch(done);
  });
}
