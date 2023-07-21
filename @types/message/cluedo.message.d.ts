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

declare type NextGamerMessage = string;

declare interface SuggestionMessage {
  gamer: string;
  suggestion: Suggestion;
}

declare interface AccusationMessage extends SuggestionMessage {
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

declare type LeaveMessage = {
  gamer: string;
  newDisposition: {
    gamer: string;
    cards: string[];
  }[];
};

declare interface ToRoomMessage {
  gamer: string;
  room: string;
}

declare interface TakeNotesMessage {
  gamer: string;
  note: Notes;
}

declare type StopGameMessage = string;
