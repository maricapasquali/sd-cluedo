import {Gamers} from '@model';
import {GameManager, GamesManager} from '../index';

export class MongoDBGameManager implements GameManager {
  private readonly _gameId: string;

  constructor(gameId: string) {
    this._gameId = gameId;
  }

  get gameId(): string {
    return this._gameId;
  }

  findGamer(gamerId: string): Promise<Gamer | undefined> {
    return Promise.reject(new Error('not implemented'));
  }

  isInRound(gamerId: string): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  addGamer(gamer: Gamer): Promise<Gamer> {
    return Promise.reject(new Error('not implemented'));
  }

  removeGamer(gamer: string): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  startGame(): Promise<CluedoGame> {
    return Promise.reject(new Error('not implemented'));
  }

  rollDie(): Promise<HousePart> {
    return Promise.reject(new Error('not implemented'));
  }

  moveCharacterTokenIn(
    housePart?: string,
    character?: string
  ): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  makeAssumption(suggestion: Suggestion): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  takeNote(gamer: string, notes: string | StructuedNoteItem): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  makeAccusation(suggestion: Suggestion): Promise<Suggestion> {
    return Promise.reject(new Error('not implemented'));
  }

  silentGamerInRound(): Promise<Gamers.Role[]> {
    return Promise.reject(new Error('not implemented'));
  }

  reDealCardsTo(): Promise<Gamer[]> {
    return Promise.reject(new Error('not implemented'));
  }

  passRoundToNext(): Promise<string | undefined> {
    return Promise.reject(new Error('not implemented'));
  }

  stopGame(): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }
}

export const MongoDBGamesManager = new (class implements GamesManager {
  readonly _gameManagers: {[gameId: string]: GameManager} = {};

  gameManagers(identifier: string): GameManager {
    return this._gameManagers[identifier];
  }

  createGame(game: CluedoGame): Promise<CluedoGame> {
    return Promise.reject(new Error('not implemented'));
  }

  deleteGame(identifier: string): Promise<boolean> {
    return Promise.reject(new Error('not implemented'));
  }

  getGames(status?: string): Promise<CluedoGame[]> {
    return Promise.reject(new Error('not implemented'));
  }
})();
