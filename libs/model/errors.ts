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
      `Min ${Gamers.MIN} and max ${Gamers.MAX} gamers for game.`,
      GameRuleError.NO_CONFORM_GAMERS
    );
  }
}

export namespace GameRuleError {
  export const NO_CONFORM_GAMERS = 'NO_CONFORM_GAMERS';
}
