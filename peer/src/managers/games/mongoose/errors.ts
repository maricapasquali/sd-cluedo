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

export namespace NotFoundError {
  export const NOT_FOUND_GAME = 'NOT_FOUND_GAME';
  export const NOT_FOUND_SECRET_PASSAGE = 'NOT_FOUND_SECRET_PASSAGE';
}
