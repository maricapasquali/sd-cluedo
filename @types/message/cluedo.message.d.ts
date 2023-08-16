/**
 * It represents a cluedo game.
 * This message is sent to other peer and/or clients when
 * a new game are created or are started or are stopped.
 */
declare interface CluedoGameMessage extends CluedoGame {}

/**
 * It represents a new gamer in an existing cluedo game.
 * This message is sent to other peer and/or clients when
 * a new gamer joins in an existing cluedo game.
 */
declare interface GamerMessage {
  game: string;
  gamer: Gamer;
}

/**
 * It represents an exited gamer from a waiting cluedo game.
 * This message is sent to other peer and/or clients when
 * a gamer exits from a waiting cluedo game.
 */
declare interface ExitGamerMessage {
  game: string;
  gamer: string;
}

/**
 * It represents the result of roll die made by a gamer
 * in round in a cluedo game.
 */
declare interface RollDiceMessage {
  gamer: string;
  housePart: string;
}

/**
 * It represents the identifier of the next gamer in a
 * cluedo game.
 */
declare type NextGamerMessage = string;

/**
 * Its represents an assumption that a gamer in round
 * makes during the cluedo game.
 */
declare interface SuggestionMessage {
  gamer: string;
  suggestion: Suggestion;
}

/**
 * Its represents an accusation that a gamer in round
 * makes during the cluedo game.
 */
declare interface AccusationMessage extends SuggestionMessage {
  win: boolean;
}

/**
 * Its represents the confutation message that next gamer
 * shows (secretly) a possible card that a gamer in round
 * has named in assumption. Otherwise, the card field
 * represents whether the gamer (refuterGamer) has refuted
 * the assumption.
 */
declare interface ConfutationMessage {
  refuterGamer: string;
  roundGamer: string;
  card: string | boolean;
}

/**
 * Its represents the new roles of gamer decides to stay in cluedo game.
 * From now, gamer can only rebut an assumption of another gamer.
 */
declare interface StayGamerMessage {
  gamer: string;
  roles: string[];
}

/**
 * Its represents the new cards disposition of remaining gamers.
 * This message is sent to other peer and/or clients when a
 * gamer decides to leave started cluedo game.
 */
declare type LeaveMessage = {
  gamer: string;
  newDisposition: {
    gamer: string;
    cards: string[];
  }[];
};

/**
 * Its represents the result of using a secret passage in a room
 * where there is a secret passage.
 */
declare interface ToRoomMessage {
  gamer: string;
  room: string;
}

/**
 * Its represents the new notes that a gamer take during a started cluedo game.
 */
declare interface TakeNotesMessage {
  gamer: string;
  note: Notes;
}
