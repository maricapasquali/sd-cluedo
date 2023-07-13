declare interface Gamer {
  identifier: string;
  username: string;
  role?: string[];
  device?: Device;
  characterToken: Character;
  assumptions?: Suggestion[];
  accusation?: Suggestion;
  cards?: Card[];
  notes?: Notes;
}

declare interface StructuedNoteItem {
  name: string;
  suspectState: string;
}

declare interface Notes {
  text?: string;
  structuedNotes?: StructuedNoteItem[];
}

declare namespace Gamers {
  enum Role {}
}
