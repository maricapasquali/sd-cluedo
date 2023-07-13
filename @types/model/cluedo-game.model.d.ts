declare interface CluedoGame {
  identifier: string;
  status?: string;
  gamers: Gamer[];
  solution?: Suggestion;
  roundGamer?: string;
  winner?: string;
  weapons?: Weapon[];
  characters?: Character[];
  rooms?: Room[];
}

declare namespace CluedoGames {
  enum Status {}
}
