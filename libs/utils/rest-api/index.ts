import {NextFunction} from 'express';

export function catchableRequestHandler(
  next: NextFunction,
  fun: () => number | void
): void {
  try {
    const returnValue = fun();
    if (!returnValue) next();
  } catch (err: any) {
    next(err);
  }
}

export enum ResponseStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}
