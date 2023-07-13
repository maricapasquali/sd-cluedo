declare interface CluedoGameMessage extends CluedoGame {}

declare interface GamerMessage {
  game: string;
  gamer: Gamer;
}

declare interface ExitGamerMessage {
  game: string;
  gamer: string;
}

declare interface RollDiceMessage {
  gamer: string;
  housePart: string;
}

declare const NextGamerMessage: string;

declare interface SuggestionMessage {
  gamer: string;
  suggestion: Suggestion;
}

declare interface AccusationMessage {
  gamer: string;
  accusation: Suggestion;
  win: boolean;
}

declare interface ConfutationMessage {
  refuterGamer: string;
  roundGamer: string;
  card: string;
}

declare interface StayGamerMessage {
  gamer: string;
  roles: string[];
}

declare type LeaveMessageItem = {
  gamer: string;
  cards: string[];
};

declare const LeaveMessage: LeaveMessageItem[];

declare interface ToRoomMessage {
  gamer: string;
  room: string;
}

declare interface TakeNotesMessage {
  gamer: string;
  note: Notes;
}
