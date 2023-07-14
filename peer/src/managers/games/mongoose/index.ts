import {CluedoGames, GamerElements, Gamers} from '@model';
import {CluedoGameModel, ICluedoGame} from './schemas';
import {GameManager, GamesManager} from '../index';
import * as _ from 'lodash';
import {NotFoundError} from './errors';

export class MongoDBGameManager implements GameManager {
  private readonly _gameId: string;

  constructor(gameId: string) {
    this._gameId = gameId;
  }

  get game(): Promise<ICluedoGame> {
    return CluedoGameModel.findOne({identifier: this._gameId}).then(game => {
      if (!game) {
        throw new NotFoundError({
          code: NotFoundError.NOT_FOUND_GAME,
          message: `Game ${this._gameId} is not found`,
        });
      }
      return game;
    });
  }

  findGamer(gamerId: string): Promise<Gamer | undefined> {
    return CluedoGameModel.findOne(
      {identifier: this._gameId, 'gamers.identifier': gamerId},
      {gamers: 1}
    ).then(game => game?.toObject().gamers.find(g => g.identifier === gamerId));
  }

  isInRound(gamerId: string): Promise<boolean> {
    return CluedoGameModel.findOne({
      identifier: this._gameId,
      roundGamer: gamerId,
    }).then(game => !!game);
  }

  addGamer(gamer: Gamer): Promise<Gamer> {
    return CluedoGameModel.findOneAndUpdate(
      {identifier: this._gameId},
      {$push: {gamers: gamer}},
      {new: true}
    ).then(game => {
      const nGamers: number = game?.gamers.length || 0;
      return game?.toObject().gamers[nGamers - 1] as Gamer;
    });
  }

  removeGamer(gamer: string): Promise<boolean> {
    return CluedoGameModel.updateOne(
      {identifier: this._gameId},
      {$pull: {gamers: {identifier: gamer}}}
    ).then(result => result.modifiedCount === 1);
  }

  startGame(): Promise<CluedoGame> {
    return this.game
      .then(game => {
        const weapons: Weapon[] = Object.values(GamerElements.WeaponName).map(
          wn => ({name: wn} as Weapon)
        );

        const rooms: Room[] = Object.values(GamerElements.RoomName).map(
          rn =>
            ({
              name: rn,
              secretPassage: GamerElements.RoomWithSecretPassage[rn],
            } as Room)
        );
        const characters: Character[] = Object.values(
          GamerElements.CharacterName
        ).map(
          cn =>
            ({
              name: cn,
              place: GamerElements.LobbyName.MAIN_LOBBY,
            } as Character)
        );

        game.status = CluedoGames.Status.STARTED;
        game.weapons = weapons;
        game.characters = characters;
        game.rooms = rooms;
        const _solution: Suggestion = {
          character: characters[this.randIndex(characters.length)].name,
          room: rooms[this.randIndex(rooms.length)].name,
          weapon: weapons[this.randIndex(weapons.length)].name,
        };
        game.solution = _solution;
        game.roundGamer = game.gamers[0].identifier;
        const _cardsDeck = [
          ...Object.values(GamerElements.RoomName),
          ...Object.values(GamerElements.WeaponName),
          ...Object.values(GamerElements.CharacterName),
        ].filter(c => !Object.values(_solution).includes(c));
        this.dealCards(_.shuffle(_cardsDeck), game.gamers);
        return game.save();
      })
      .then(newGame => newGame.toObject());
  }

  rollDie(): Promise<string> {
    const _housePartsNames: string[] = _.shuffle([
      ...Object.values(GamerElements.RoomName),
      ...Object.values(GamerElements.LobbyName),
    ]);
    const _randHousePart: string =
      _housePartsNames[this.randIndex(_housePartsNames.length)];
    return this.game
      .then(game => {
        const _gamerRound = this.getRoundGamer(game);
        const _character: Character =
          game.characters?.find(c => c.name === _gamerRound?.characterToken) ||
          ({} as Character);
        _character.place = _randHousePart;
        return game.save();
      })
      .then(() => _randHousePart);
  }

  useSecretPassage(): Promise<string> {
    return this.game.then(game => {
      const _gamerRound = this.getRoundGamer(game);
      const _character: Character = this.getCharacter(
        game,
        _gamerRound?.characterToken
      );
      const actualRoom =
        game.rooms?.find(c => c.name === _character?.place) || ({} as Room);
      if (actualRoom?.secretPassage) {
        _character.place = actualRoom?.secretPassage;
      }
      return game.save().then(() => {
        if (!actualRoom?.secretPassage) {
          throw new NotFoundError({
            code: NotFoundError.NOT_FOUND_SECRET_PASSAGE,
            message: `Room '${actualRoom.name}' does not have a secret passage`,
          });
        }
        return actualRoom?.secretPassage;
      });
    });
  }

  makeAssumption(suggestion: Suggestion): Promise<boolean> {
    return this.game.then(game => {
      const _gameObj = game.toObject();
      const _gamerRound = this.getRoundGamer(game);
      _gamerRound.assumptions?.push(suggestion);
      const weapon: Weapon =
        game.weapons?.find(w => w.name === suggestion.weapon) || ({} as Weapon);
      const character: Character = this.getCharacter(
        game,
        suggestion.character
      );
      weapon.place = suggestion.room;
      character.place = suggestion.room;
      return game
        .save()
        .then(newGame => !_.isEqual(newGame.toObject(), _gameObj));
    });
  }

  takeNote(gamer: string, notes: string | StructuedNoteItem): Promise<boolean> {
    let updated;
    if (typeof notes === 'string') {
      updated = {
        'gamers.$.notes.text': notes,
      };
    } else {
      updated = {
        $push: {'gamers.$.notes.structuredNotes': notes},
      };
    }
    return CluedoGameModel.updateOne(
      {
        identifier: this._gameId,
        'gamers.identifier': gamer,
      },
      updated
    ).then(res => res.modifiedCount === 1);
  }

  makeAccusation(suggestion: Suggestion): Promise<Suggestion> {
    return this.game.then(game => {
      const _gameObj = game.toObject();
      const _gamerRound = this.getRoundGamer(game);
      _gamerRound.accusation = suggestion;
      return game.save().then(() => _gameObj.solution || ({} as Suggestion));
    });
  }

  silentGamerInRound(): Promise<string[]> {
    return this.game.then(game => {
      const _gamerRound = this.getRoundGamer(game);
      const index =
        _gamerRound?.role?.findIndex(r => r === Gamers.Role.PARTICIPANT) || -1;
      if (index > 0 && _gamerRound.role) {
        _gamerRound.role[index] = Gamers.Role.SILENT;
      }
      return game.save().then(() => _gamerRound.role || []);
    });
  }

  leave(): Promise<Gamer[]> {
    return this.game.then(game => {
      const cardsGamerInRound =
        game.gamers?.find(g => g.identifier === game.roundGamer)?.cards || [];
      const _gamers = game.gamers?.filter(
        g => g.identifier !== game.roundGamer
      );
      this.dealCards(cardsGamerInRound, _gamers);
      game.gamers = _gamers;
      return game.save().then(() => _gamers);
    });
  }

  passRoundToNext(): Promise<string | undefined> {
    return this.game.then(game => {
      const _gameObj = game.toObject();
      const gamerRoundId = game.roundGamer;
      const _actualPosition = game.gamers?.findIndex(
        g => g.identifier === gamerRoundId
      );
      const _nextPosition: number = (_actualPosition + 1) % game.gamers.length;
      const _nextRoundGamer: string = game.gamers[_nextPosition].identifier;
      game.roundGamer = _nextRoundGamer;
      return game
        .save()
        .then(newGame =>
          _.isEqual(newGame.toObject(), _gameObj) ? undefined : _nextRoundGamer
        );
    });
  }

  stopGame(): Promise<boolean> {
    return CluedoGameModel.updateOne(
      {identifier: this._gameId},
      {$set: {status: CluedoGames.Status.FINISHED}}
    ).then(result => result.modifiedCount === 1);
  }

  private randIndex(lengthOfArray: number): number {
    return Math.floor(Math.random() * (lengthOfArray - 1));
  }

  private dealCards(cardsDeck: string[], gamers: Gamer[]): void {
    while (cardsDeck.length > 0) {
      for (let i = 0; i < gamers.length; i++) {
        const card = cardsDeck.shift();
        if (!card) break;
        gamers[i].cards?.push(card);
      }
    }
  }

  private getRoundGamer(game: CluedoGame): Gamer {
    return (
      game.gamers.find(g => g.identifier === game.roundGamer) || ({} as Gamer)
    );
  }

  private getCharacter(game: CluedoGame, characterName: string): Character {
    return (
      game.characters?.find(c => c.name === characterName) || ({} as Character)
    );
  }
}

export const MongoDBGamesManager = new (class implements GamesManager {
  readonly _gameManagers: {[gameId: string]: GameManager} = {};

  gameManagers(identifier: string): GameManager {
    return this._gameManagers[identifier];
  }

  createGame(game: CluedoGame): Promise<CluedoGame> {
    game.gamers.forEach(
      g => (g.role = [Gamers.Role.CREATOR, Gamers.Role.PARTICIPANT])
    );
    return new CluedoGameModel(game).save().then(gameDoc => {
      const game: CluedoGame = gameDoc.toObject();
      this._gameManagers[game.identifier] = new MongoDBGameManager(
        game.identifier
      );
      return game;
    });
  }

  deleteGame(identifier: string): Promise<boolean> {
    return CluedoGameModel.deleteOne({identifier}).then(
      result => result.deletedCount === 1
    );
  }

  getGames(status?: string): Promise<CluedoGame[]> {
    return CluedoGameModel.find(status ? {status} : {}).then(
      games => games.map(gs => gs.toObject()) as CluedoGame[]
    );
  }
})();
