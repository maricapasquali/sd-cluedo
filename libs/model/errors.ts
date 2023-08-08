import {CluedoGames} from './cluedo-game.model';

export class GameRuleError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export class NoConformNumberOfGamersError extends GameRuleError {
  constructor() {
    super(
      `Min ${CluedoGames.MIN_GAMERS} and max ${CluedoGames.MAX_GAMERS} gamers for game.`,
      GameRuleError.NO_CONFORM_GAMERS
    );
  }
}

export namespace GameRuleError {
  export const NO_CONFORM_GAMERS = 'NO_CONFORM_GAMERS';
}
