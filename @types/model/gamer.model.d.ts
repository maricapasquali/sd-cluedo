/**
 * It represents a gamer of a cluedo game.
 */
declare interface Gamer {
  identifier: string;
  username: string;
  characterToken: string;
  role?: string[];
  device?: Device;
  assumptions?: Assumption[];
  accusation?: Suggestion;
  cards?: string[];
  notes?: Notes;
}

/**
 * It represents an item of structured note.
 */
declare interface StructuredNoteItem {
  name: string;
  suspectState: string;
  confutation?: true;
}

/**
 * It represents gamer's notes taken during the cluedo game.
 */
declare interface Notes {
  text?: string;
  structuredNotes?: StructuredNoteItem[];
}
