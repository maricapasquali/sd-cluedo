declare interface Gamer {
  identifier: string;
  username: string;
  characterToken: string;
  role?: string[];
  device?: Device;
  assumptions?: Suggestion[];
  accusation?: Suggestion;
  cards?: string[];
  notes?: Notes;
}

declare interface StructuedNoteItem {
  name: string;
  suspectState: string;
}

declare interface Notes {
  text?: string;
  structuredNotes?: StructuedNoteItem[];
}

declare namespace Gamers {
  const MIN: number;
  const MAX: number;
  enum Role {}
}
