declare interface GameElement {
  name: string;
}

declare interface HousePart extends GameElement {}

declare interface Card extends GameElement {}

declare interface Lobby extends HousePart {
  isMain: boolean;
}

declare interface Room extends HousePart, Card {
  secretPassage?: Room;
}

declare interface Weapon extends Card {
  place?: Room;
}

declare interface Character extends Card {
  place?: HousePart;
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
}
