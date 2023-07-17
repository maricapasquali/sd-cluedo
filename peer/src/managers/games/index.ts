import {DocCluedoGame} from './mongoose/schemas';

export interface GameManager {
  game(filters?: {status?: string; gamer?: string}): Promise<DocCluedoGame>;
  findGamer(gamerId: string): Promise<Gamer | undefined>;
  isInRound(gamerId: string): Promise<boolean>;
  addGamer(gamer: Gamer): Promise<Gamer>;
  removeGamer(gamer: string): Promise<boolean>;
  startGame(): Promise<CluedoGame>;

  rollDie(): Promise<string>;
  useSecretPassage(): Promise<string>;
  makeAssumption(suggestion: Suggestion): Promise<boolean>;
  takeNote(gamer: string, notes: string | StructuedNoteItem): Promise<boolean>;
  makeAccusation(suggestion: Suggestion): Promise<Suggestion>;
  silentGamerInRound(): Promise<Gamer>;
  leave(gamerId?: string): Promise<Gamer[]>;
  passRoundToNext(gamerId?: string): Promise<string | undefined>;
  stopGame(): Promise<boolean>;
}

export interface GamesManager {
  gameManagers(identifier: string): GameManager;
  createGame(game: CluedoGame): Promise<CluedoGame>;
  getGames(status?: string): Promise<CluedoGame[]>;
}
