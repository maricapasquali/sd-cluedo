declare interface GameElement {
  name: string;
}

declare interface HousePart extends GameElement {}

declare interface Lobby extends HousePart {}

declare interface Room extends HousePart {
  secretPassage?: string;
}

declare interface Weapon extends GameElement {
  place?: string;
}

declare interface Character extends GameElement {
  place?: string;
}

declare interface Suggestion {
  character: string;
  weapon: string;
  room: string;
}

declare namespace GamerElements {
  enum LobbyName {}

  enum CharacterName {}

  enum WeaponName {}

  enum RoomName {}

  enum SuspectState {}
}
