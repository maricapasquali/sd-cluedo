import {Gamers} from '@model';
export interface GameManager {
  gameId: string;
  findGamer(gamerId: string): Promise<Gamer | undefined>;
  isInRound(gamerId: string): Promise<boolean>;
  addGamer(gamer: Gamer): Promise<Gamer>;
  removeGamer(gamer: string): Promise<boolean>;
  startGame(): Promise<CluedoGame>;

  rollDie(): Promise<HousePart>;
  moveCharacterTokenIn(
    housePart?: string,
    character?: string
  ): Promise<boolean>;
  makeAssumption(suggestion: Suggestion): Promise<boolean>;
  takeNote(gamer: string, notes: string | StructuedNoteItem): Promise<boolean>;
  makeAccusation(suggestion: Suggestion): Promise<Suggestion>;
  silentGamerInRound(): Promise<Gamers.Role[]>;
  reDealCardsTo(): Promise<Gamer[]>;
  passRoundToNext(): Promise<string | undefined>;
  stopGame(): Promise<boolean>;
}

export interface GamesManager {
  gameManagers(identifier: string): GameManager;
  createGame(game: CluedoGame): Promise<CluedoGame>;
  getGames(status?: string): Promise<CluedoGame[]>;
  deleteGame(identifier: string): Promise<boolean>;
}
