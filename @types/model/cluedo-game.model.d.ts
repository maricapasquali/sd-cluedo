declare interface CluedoGame {
  identifier: string;
  status: string;
  gamers: Gamer[];
  solution?: Suggestion;
  roundGamer?: Gamer;
  winner?: Gamer;
  weapons: Weapon[];
  characters: Character[];
  rooms: Room[];
}

declare namespace CluedoGames {
  enum Status {}
}
