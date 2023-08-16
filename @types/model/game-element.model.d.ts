/**
 * It represents a generic game element.
 */
declare interface GameElement {
  /**
   * identifier of game element.
   */
  name: string;
}

/**
 * It represents a generic house part of cluedo game board.
 */
declare interface HousePart extends GameElement {}

/**
 * It represents a generic lobby of cluedo game board.
 */
declare interface Lobby extends HousePart {}

/**
 * It represents a generic room of cluedo game board.
 */
declare interface Room extends HousePart {
  secretPassage?: string;
}

/**
 * It represents a generic weapon of cluedo game.
 */
declare interface Weapon extends GameElement {
  /**
   * identifier of the room of the cluedo board where the weapon can be placed.
   */
  place?: string;
}

/**
 * It represents a generic suspect (character) of cluedo game.
 */
declare interface Character extends GameElement {
  /**
   * identifier of the room or lobby of the cluedo board where the gamer token can be placed.
   */
  place?: string;
}

/**
 * It represents a generic suggestion of cluedo game.
 */
declare interface Suggestion {
  character: string;
  weapon: string;
  room: string;
}

/**
 * It represents a generic assumption that a gamer can make during your round in the cluedo game.
 */
declare interface Assumption extends Suggestion {
  confutation?: {gamer: string; card: string | boolean}[];
}
