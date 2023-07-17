declare interface CluedoGame {
  identifier: string;
  gamers: Gamer[];
  status?: string;
  solution?: Suggestion;
  roundGamer?: string;
  weapons?: Weapon[];
  characters?: Character[];
  rooms?: Room[];
  lobbies?: Lobby[];
}
