import {MongooseError} from 'mongoose';

export type DataError = {code: string | number; message: string};
export class NotFoundError extends MongooseError {
  readonly status: number = 404;
  readonly code: string | number;
  constructor(dataError: DataError) {
    super(dataError.message);
    this.code = dataError.code;
  }
}

export class NotInRoundError extends MongooseError {
  constructor(gamerId: string) {
    super(`Gamer ${gamerId} is not in round.`);
  }
}

export namespace NotFoundError {
  export const NOT_FOUND_GAME = 'NOT_FOUND_GAME';
  export const NOT_FOUND_GAMER = 'NOT_FOUND_GAMER';
  export const NOT_FOUND_SECRET_PASSAGE = 'NOT_FOUND_SECRET_PASSAGE';
}
