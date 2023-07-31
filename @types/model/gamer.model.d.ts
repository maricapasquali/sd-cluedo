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

declare interface StructuredNoteItem {
  name: string;
  suspectState: string;
  confutation?: true;
}

declare interface Notes {
  text?: string;
  structuredNotes?: StructuredNoteItem[];
}
