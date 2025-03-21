import {MongoDBGamesManager} from '../../src/managers/games/mongoose';
import {v4 as uuid} from 'uuid';
import {should as shouldFunc} from 'chai';
import {logger} from '@utils/logger';
import {Gamer, CluedoGame, GameElements} from '@model';
import {GameManager} from '../../src/managers/games';
import {CluedoGameModel} from '../../src/managers/games/mongoose/schemas';
import * as _ from 'lodash';
import GamerRole = Gamer.Role;
import CharacterName = GameElements.CharacterName;
import RoomName = GameElements.RoomName;
import WeaponName = GameElements.WeaponName;
import HousePart = GameElements.HousePart;

const should = shouldFunc();

type GameManagerOptions = {
  game: CluedoGame;
};
export default function ({game}: GameManagerOptions): void {
  const gamer1: Gamer = {
    identifier: uuid(),
    username: 'antonio01',
    characterToken: CharacterName.MISS_SCARLET,
  };
  const gamer2: Gamer = {
    identifier: uuid(),
    username: 'anna',
    characterToken: CharacterName.MRS_PEACOCK,
  };
  let gameManager: GameManager;
  let gamerInRound: Gamer;
  const assumption: Suggestion = {
    character: CharacterName.MISS_SCARLET,
    room: RoomName.DINING_ROOM,
    weapon: WeaponName.DAGGER,
  };

  before(() => {
    gameManager = MongoDBGamesManager.gameManagers(game.identifier);
  });

  it('after create game, a game manager should have been generated for the created game', done => {
    gameManager
      .game()
      .then(storedGame => {
        should.exist(storedGame);
        storedGame.should.have.property('identifier').equal(game.identifier);
        done();
      })
      .catch(done);
  });

  it('#addGamer(..)', done => {
    gameManager
      .addGamer(gamer1)
      .then(newGamer => {
        logger.debug(newGamer);
        newGamer.should.have.property('identifier').equal(gamer1.identifier);
        newGamer.should.have
          .property('role')
          .deep.equal([GamerRole.PARTICIPANT]);
        done();
      })
      .catch(done);
  });

  it('#findGamer(..)', done => {
    gameManager
      .findGamer(gamer1.identifier)
      .then(fGamer => {
        logger.debug(fGamer);
        should.exist(fGamer);
        fGamer?.should.have.property('identifier').equal(gamer1.identifier);
        done();
      })
      .catch(done);
  });

  it('#removeGamer(..)', done => {
    gameManager
      .removeGamer(gamer1.identifier)
      .then(deleted => {
        logger.debug(deleted);
        deleted.should.be.true;
        done();
      })
      .catch(done);
  });

  it('#startGame(..)', done => {
    gameManager
      .addGamer(gamer1)
      .then(() => gameManager.addGamer(gamer2))
      .then(() => gameManager.startGame())
      .then(startedGame => {
        logger.debug(startedGame);
        should.exist(startedGame);
        startedGame.should.have
          .property('status')
          .equal(CluedoGame.Status.STARTED);
        startedGame.should.have.property('solution').not.undefined;
        const dealCard = _.flatten(startedGame.gamers.map(g => g.cards));
        dealCard.should.not.empty;
        dealCard.should.have.lengthOf(18);
        dealCard.should.have.not.members(
          Object.values(startedGame.solution || {})
        );
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
    gameManager
      .rollDie()
      .then(housePart => {
        logger.debug(housePart);
        housePart.should.be.oneOf(HousePart);
        done();
      })
      .catch(done);
  });

  it('#useSecretPassage(..)', done => {
    CluedoGameModel.updateOne(
      {
        identifier: game.identifier,
        'characters.name': gamerInRound.characterToken,
      },
      {
        $set: {
          'characters.$.place': RoomName.DINING_ROOM,
        },
      }
    )
      .then(() => gameManager.useSecretPassage())
      .then(room => {
        should.exist(room);
        room.should.equal(RoomName.BILLIARD_ROOM);
        done();
      })
      .catch(done);
  });

  it('#makeAssumption(..)', done => {
    gameManager
      .makeAssumption(assumption)
      .then(updated => {
        logger.debug(updated);
        updated.should.be.true;
        done();
      })
      .catch(done);
  });

  it('#confuteLastAssumptionOfRoundedGamer(..)', done => {
    const confutedCard =
      (
        game.gamers.find(g => g.identifier === gamer1.identifier)?.cards || []
      ).find(c => Object.values(assumption).includes(c)) || '';

    gameManager
      .confuteLastAssumptionOfRoundedGamer(gamer1.identifier, confutedCard)
      .then(game => {
        const assumption: Assumption[] =
          game.gamers.find(g => g.identifier === gamerInRound.identifier)
            ?.assumptions || [];
        const lastAssumptionIndex = assumption.length - 1;
        if (lastAssumptionIndex > -1) {
          assumption[lastAssumptionIndex].confutation?.should.deep.contain({
            gamer: gamer1.identifier,
            card: confutedCard,
          });
          done();
        } else done('No last assumption');
      })
      .catch(done);
  });

  it('#makeAccusation(..): wrong accusation', done => {
    const suggestion: Suggestion = {
      character: CharacterName.MISS_SCARLET,
      room: Object.values(RoomName).find(r => game.solution?.room !== r) || '',
      weapon: WeaponName.DAGGER,
    };
    logger.debug(suggestion);
    gameManager
      .makeAccusation(suggestion)
      .then(solution => {
        logger.debug(solution);
        solution.should.be.not.deep.equal(suggestion);
        done();
      })
      .catch(done);
  });
  it('#makeAccusation(..): right accusation', done => {
    const gameSol = game.solution || ({} as Suggestion);
    logger.debug(gameSol);
    gameManager
      .makeAccusation(gameSol)
      .then(solution => {
        logger.debug(solution);
        solution.should.be.deep.equal(gameSol);
        done();
      })
      .catch(done);
  });

  it('#takeNote(..)', done => {
    const structuredNoteItem: StructuredNoteItem = {
      name: RoomName.STUDY,
      suspectState: GameElements.SuspectState.MAYBE,
    };
    const text =
      'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua';
    const notes: Notes = {
      text,
      structuredNotes: [structuredNoteItem],
    };
    gameManager
      .takeNote(gamer2.identifier, notes)
      .then(added => {
        logger.debug(added);
        added.should.be.true;
        done();
      })
      .catch(done);
  });

  it('#silentGamer(..)', done => {
    gameManager
      .silentGamerInRound()
      .then(gamer => {
        logger.debug(gamer.role);
        gamer.should.have
          .property('role')
          .that.contains(GamerRole.SILENT)
          .and.not.contains(GamerRole.PARTICIPANT);
        done();
      })
      .catch(done);
  });

  it('#passRoundToNext(..)', done => {
    const nextToGamer = gamer1.identifier;
    gameManager
      .passRoundToNext()
      .then(newRoundGamer => {
        logger.debug(newRoundGamer);
        should.exist(newRoundGamer);
        newRoundGamer?.should.equals(nextToGamer);
        gamerInRound = gamer1;
        done();
      })
      .catch(done);
  });

  it('#leave(..)', done => {
    gameManager
      .leave()
      .then(newGamersDisposition => {
        logger.debug(newGamersDisposition);
        should.exist(newGamersDisposition);
        _.flatten(
          newGamersDisposition.map(g => g.cards)
        ).should.to.include.members(gamerInRound.cards || []);

        return CluedoGameModel.findOne({
          identifier: game.identifier,
          'gamers.identifier': gamerInRound.identifier,
        });
      })
      .then(game => {
        if (!game) done();
        else done(new Error('#leave(..) does not delete the leaving player'));
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
