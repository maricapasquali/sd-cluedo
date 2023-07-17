export namespace CluedoGames {
  export const MIN_GAMERS = 3;
  export const MAX_GAMERS = 6;

  export enum Status {
    WAITING = 'waiting',
    STARTED = 'started',
    FINISHED = 'finished',
  }

  export function checkNumberOfGamers(game: CluedoGame): boolean {
    return game.gamers.length >= MIN_GAMERS && game.gamers.length <= MAX_GAMERS;
  }
}
