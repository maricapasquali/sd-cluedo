export namespace CluedoGame {
  export const MIN_GAMERS = 3;
  export const MAX_GAMERS = 6;

  export enum Status {
    WAITING = 'waiting',
    STARTED = 'started',
    FINISHED = 'finished',
  }
}

export namespace CluedoGames {
  export function checkNumberOfGamers(game: CluedoGame): boolean {
    return (
      game.gamers.length >= CluedoGame.MIN_GAMERS &&
      game.gamers.length <= CluedoGame.MAX_GAMERS
    );
  }
}
