import {DocCluedoGame} from './mongoose/schemas';

/**
 * It represents a generic game manager.
 */
export interface GameManager {
  /**
   * Identifier of cluedo game.
   */
  gameId: string;

  /**
   * Retrieve the cluedo game ({@link GameManager.gameId}) with optional filters.
   * @param filters (optional) object used to filter the game.
   * _status_ (optional) is a cluedo status and _gamer_ (optional) is an
   * identifier of gamer.
   */
  game(filters?: {status?: string; gamer?: string}): Promise<DocCluedoGame>;

  /**
   * Retrieve {@link Gamer} if a given gamer is in this specific cluedo game,
   * otherwise return _undefined_.
   * @param gamerId identifier of gamer.
   */
  findGamer(gamerId: string): Promise<Gamer | undefined>;

  /**
   * Check if a given gamer is in round in the given cluedo game.
   * @param gamerId identifier of gamer.
   */
  isInRound(gamerId: string): Promise<boolean>;

  /**
   * Add a given gamer in this specific cluedo game.
   * @param gamer gamer to add.
   */
  addGamer(gamer: Gamer): Promise<Gamer>;

  /**
   * Remove a given gamer in this specific cluedo game.
   * @param gamer identifier of gamer to remove.
   */
  removeGamer(gamer: string): Promise<boolean>;

  /**
   * Initialize the game board and start game.
   */
  startGame(): Promise<CluedoGame>;

  /**
   * Retrieve a random room or lobby name.
   */
  rollDie(): Promise<string>;

  /**
   * Retrieve the name of a room which is a secret passage of the room the
   * gamer in round is in.
   */
  useSecretPassage(): Promise<string>;

  /**
   * Add to the gamer in the round the assumption he made.
   * @param suggestion assumption to add.
   */
  makeAssumption(suggestion: Suggestion): Promise<boolean>;

  /**
   * Add into the last assumption of the gamer in round,
   * the refutation card.
   * @param gamer identifier of gamer.
   * @param card refutation card referring to the assumption
   * made by the gamer in round.
   */
  confuteLastAssumptionOfRoundedGamer(
    gamer: string,
    card: string
  ): Promise<CluedoGame>;

  /**
   * Update the notes of particular gamer.
   * @param gamer identifier of gamer to select.
   * @param notes updated notes to add.
   */
  takeNote(gamer: string, notes: Notes): Promise<boolean>;

  /**
   * Add to the gamer in the round the accusation he made.
   * @param suggestion accusation to add.
   */
  makeAccusation(suggestion: Suggestion): Promise<Suggestion>;

  /**
   * Insert a new role ('silent' role) in gamer in round.
   */
  silentGamerInRound(): Promise<Gamer>;

  /**
   * Remove the gamer in round and return the list of remaining gamers
   * with new cards in their deck.
   * @param gamerId identifier of gamer.
   */
  leave(gamerId?: string): Promise<Gamer[]>;

  /**
   * Pass the turn to the next gamer and return the next gamer identifier,
   * otherwise if there is no available gamer, return undefined.
   * @param gamerId (optional) identifier of next gamer.
   */
  passRoundToNext(gamerId?: string): Promise<string | undefined>;

  /**
   * Stop the cluedo game.
   */
  stopGame(): Promise<boolean>;

  /**
   * Move character token into a given house part.
   * @param gamerId identifier of gamer.
   * @param housePart house part to move the gamer token to.
   */
  moveCharacterIn(gamerId: string, housePart: string): Promise<boolean>;
}

/**
 * It represents a generic games manager.
 */
export interface GamesManager {
  /**
   * Retrieve the game manager ({@link GameManager}) of the given game.
   * @param identifier identifier of game.
   */
  gameManagers(identifier: string): GameManager;

  /**
   * Add a new cluedo game.
   * @param game game to add.
   */
  createGame(game: CluedoGame): Promise<CluedoGame>;

  /**
   * Retrieve games with optional status.
   * @param status (optional) cluedo game status.
   */
  getGames(status?: string | string[]): Promise<CluedoGame[]>;

  /**
   * Remove all gamers connected to the given device.
   * @param deviceURL device url to select.
   * @param callback (optional) callback called after save a particular game.
   */
  removeGamersOf(
    deviceURL: string,
    callback?: (
      newGame: CluedoGame,
      removedGamers: Gamer[],
      oldRoundGamer: string
    ) => void
  ): Promise<CluedoGame[]>;
}
