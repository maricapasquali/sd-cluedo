export interface GameManager {
  game: CluedoGame;
  addGamer(gamer: Gamer): void;
  startGame(): void;
  stopGame(): void;
  rollDie(gamer: Gamer): HousePart;
  moveCharacterTokenIn(character: Character, housePart: HousePart): void;
  makeAssumption(gamer: Gamer, suggestion: Suggestion): void;
  showCardTo(card: Card, gamer: Gamer): void;
  takeNote(gamer: Gamer, notes: string | StructuedNoteItem): void;
  makeAccusation(gamer: Gamer, suggestion: Suggestion): void;
  showSolutionCardTo(gamer: Gamer): void;
  silentGamer(gamer: Gamer): void;
  removeGamer(gamer: Gamer): void;
  reDealCardsTo(cards: Card[], gamers: Gamer[]): void;
  passRoundToNext(gamer: Gamer): void;
}

export interface GamesManager {
  gameManagers: GameManager[];
  createGame(): void;
  filterGame(status?: string): CluedoGame[];
  deleteGame(identifier: string): void;
}
