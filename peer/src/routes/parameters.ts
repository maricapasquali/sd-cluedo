export namespace QueryParameters {
  export enum Action {
    START_GAME = 'start_game',
    ROLL_DIE = 'roll_die',
    END_ROUND = 'end_round',
    MAKE_ASSUMPTION = 'make_assumption',
    CONFUTATION_ASSUMPTION = 'confutation_assumption',
    MAKE_ACCUSATION = 'make_accusation',
    LEAVE = 'leave',
    STAY = 'stay',
    USE_SECRET_PASSAGE = 'use_secret_passage',
    TAKE_NOTES = 'take_notes',
    STOP_GAME = 'stop_game',
  }
}
