import {CluedoGames, GamerElements, Gamers} from '@model';
import {CluedoGameModel, DocCluedoGame} from './schemas';
import {GameManager, GamesManager} from '../index';
import * as _ from 'lodash';
import {NotFoundError, NotInRoundError} from './errors';
import HousePart = GamerElements.HousePart;
import RoomName = GamerElements.RoomName;
import CharacterName = GamerElements.CharacterName;
import WeaponName = GamerElements.WeaponName;
import LobbyName = GamerElements.LobbyName;
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
import CardsDeck = GamerElements.CardsDeck;
import GameStatus = CluedoGames.Status;
import GamerRole = Gamers.Role;

export class MongoDBGameManager implements GameManager {
  private readonly _gameId: string;

  constructor(gameId: string) {
    this._gameId = gameId;
  }

  game(filters?: {status?: string; gamer?: string}): Promise<DocCluedoGame> {
    const _filters: {
      identifier: string;
      status?: string;
      ['gamers.identifier']?: string;
    } = {
      identifier: this._gameId,
    };
    if (filters?.status) _filters.status = filters.status;
    if (filters?.gamer) _filters['gamers.identifier'] = filters.gamer;
    return CluedoGameModel.findOne(_filters).then(game => {
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
    return this.game().then(game => {
      const _gamer = game.gamers.find(g => g.identifier === gamer.identifier);
      if (_gamer) return _gamer;
      game.gamers.push(gamer);
      return game.save().then(newGame => {
        const nGamers: number = newGame.gamers.length || 0;
        return game?.toObject().gamers[nGamers - 1] as Gamer;
      });
    });
  }

  removeGamer(gamer: string): Promise<boolean> {
    return CluedoGameModel.updateOne(
      {identifier: this._gameId},
      {$pull: {gamers: {identifier: gamer}}}
    ).then(result => result.modifiedCount === 1);
  }

  startGame(): Promise<CluedoGame> {
    return this.game()
      .then(game => {
        const _roomNames: string[] = _.shuffle(Object.values(RoomName));
        const _weaponNames: string[] = Object.values(WeaponName);

        const weapons: Weapon[] = [];
        while (_roomNames.length > 0) {
          for (let w = 0; w < _weaponNames.length; w++) {
            const place = _roomNames.shift();
            if (!place) break;
            weapons[w] = {name: _weaponNames[w], place};
          }
        }

        const rooms: Room[] = Object.values(RoomName).map(
          rn =>
            ({
              name: rn,
              secretPassage: RoomWithSecretPassage[rn],
            } as Room)
        );
        const characters: Character[] = Object.values(CharacterName).map(
          cn =>
            ({
              name: cn,
              place: LobbyName.MAIN_LOBBY,
            } as Character)
        );

        game.status = GameStatus.STARTED;
        game.weapons = weapons;
        game.characters = characters;
        game.rooms = rooms;
        game.lobbies = Object.values(LobbyName).map(l => ({
          name: l,
        }));
        const _solution: Suggestion = {
          character: characters[this.randIndex(characters.length)].name,
          room: rooms[this.randIndex(rooms.length)].name,
          weapon: weapons[this.randIndex(weapons.length)].name,
        };
        game.solution = _solution;
        game.roundGamer = game.gamers[0].identifier;
        const _cardsDeck: string[] = CardsDeck.filter(
          c => !Object.values(_solution).includes(c)
        );
        this.dealCards(_.shuffle(_cardsDeck), game.gamers);
        return game.save();
      })
      .then(newGame => newGame.toObject());
  }

  rollDie(): Promise<string> {
    const _housePartsNames: string[] = _.shuffle(HousePart);
    const _randHousePart: string =
      _housePartsNames[this.randIndex(_housePartsNames.length)];
    return this.game()
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
    return this.game().then(game => {
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
    return this.game().then(game => {
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

  takeNote(gamer: string, notes: Notes): Promise<boolean> {
    return CluedoGameModel.updateOne(
      {
        identifier: this._gameId,
        'gamers.identifier': gamer,
      },
      {
        $set: {'gamers.$.notes': notes},
      }
    ).then(res => res.modifiedCount === 1);
  }

  makeAccusation(suggestion: Suggestion): Promise<Suggestion> {
    return this.game().then(game => {
      const _gameObj = game.toObject();
      const _gamerRound = this.getRoundGamer(game);
      _gamerRound.accusation = suggestion;
      return game.save().then(() => _gameObj.solution);
    });
  }

  silentGamerInRound(): Promise<Gamer> {
    return this.game().then(game => {
      const _gamerRound = this.getRoundGamer(game);
      // const index =
      //   _gamerRound.role?.findIndex(r => r === GamerRole.PARTICIPANT) || -1;
      // if (index > 0 && _gamerRound.role) {
      //   _gamerRound.role[index] = GamerRole.SILENT;
      // }
      _gamerRound.role = _gamerRound.role?.map(r =>
        r === GamerRole.PARTICIPANT ? GamerRole.SILENT : r
      );
      return game.save().then(() => _gamerRound);
    });
  }

  leave(gamerId?: string): Promise<Gamer[]> {
    return this.game().then(game => {
      const _gamerId = gamerId || game.roundGamer;
      const cardsGamerInRound =
        game.gamers?.find(g => g.identifier === _gamerId)?.cards || [];
      const _gamers = game.gamers?.filter(
        g => g.identifier !== game.roundGamer
      );
      this.dealCards(cardsGamerInRound, _gamers);
      game.gamers = _gamers;
      return game.save().then(() => _gamers);
    });
  }

  passRoundToNext(gamerId?: string): Promise<string | undefined> {
    return this.game().then(game => {
      const _gameObj = game.toObject();
      const gamerRoundId = game.roundGamer;
      if (gamerId && gamerId !== gamerRoundId) {
        throw new NotInRoundError(gamerId);
      }
      let _nextPosition = game.gamers?.findIndex(
        g => g.identifier === gamerRoundId
      );
      do {
        _nextPosition = (_nextPosition + 1) % game.gamers.length;
      } while (game.gamers[_nextPosition].role?.includes(GamerRole.SILENT));
      game.roundGamer = game.gamers[_nextPosition].identifier;
      return game
        .save()
        .then(newGame =>
          _.isEqual(newGame.toObject(), _gameObj)
            ? undefined
            : newGame.roundGamer
        );
    });
  }

  stopGame(): Promise<boolean> {
    return CluedoGameModel.updateOne(
      {identifier: this._gameId},
      {$set: {status: GameStatus.FINISHED}}
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
    const gamer = game.gamers.find(g => g.identifier === game.roundGamer);
    if (!gamer)
      throw new NotFoundError({
        code: NotFoundError.NOT_FOUND_GAMER,
        message: `Gamer ${game.roundGamer} is not found`,
      });
    return gamer || ({} as Gamer);
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
    if (!this._gameManagers[identifier]) {
      this._gameManagers[identifier] = new MongoDBGameManager(identifier);
    }
    return this._gameManagers[identifier];
  }

  createGame(game: CluedoGame): Promise<CluedoGame> {
    game.gamers.forEach(
      g => (g.role = [GamerRole.CREATOR, GamerRole.PARTICIPANT])
    );
    return CluedoGameModel.findOneAndReplace(
      {identifier: game.identifier},
      game,
      {
        upsert: true,
        returnDocument: 'after',
      }
    ).then(gameDoc => {
      const game: CluedoGame = gameDoc.toObject();
      this._gameManagers[game.identifier] = new MongoDBGameManager(
        game.identifier
      );
      return game;
    });
  }

  getGames(status?: string | string[]): Promise<CluedoGame[]> {
    const filters: {[key: string]: any} = {};
    if (status) {
      if (typeof status === 'string') {
        filters.status = status;
      } else {
        filters.status = {$in: status};
      }
    }
    return CluedoGameModel.find(filters).then(
      games => games.map(gs => gs.toObject()) as CluedoGame[]
    );
  }
})();
