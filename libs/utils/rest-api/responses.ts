import {Response} from 'express';

export interface MessageError {
  message: string;
  cause?: string | object | any;
  code?: number;
}

export enum ResponseStatus {
  OK = 200,
  CREATED = 201,
  MOVED_PERMANENTLY = 301,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}

export interface ResponseSender {
  status: ResponseStatus;
  json(res: Response, payload: MessageError | any): ResponseStatus;
}

class BasicResponseSender implements ResponseSender {
  readonly status: ResponseStatus;

  private readonly meaning: string;

  protected constructor(status: ResponseStatus) {
    this.status = status;
    this.meaning = ResponseStatus[status].replace('_', ' ');
  }

  static create(status: ResponseStatus): ResponseSender {
    return new BasicResponseSender(status);
  }

  json(res: Response, payload: MessageError | any): ResponseStatus {
    if ('message' in payload) {
      const {message, cause, code} = payload;
      res.status(this.status).json({
        message: message,
        cause: cause || this.meaning,
        code,
      });
    } else {
      res.status(this.status).json(payload);
    }
    return this.status;
  }
}

export const CreatedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.CREATED
);
export const OkSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.OK
);

export const BadRequestSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.BAD_REQUEST
);

export const NotFoundSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.NOT_FOUND
);

export const UnauthorizedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.UNAUTHORIZED
);

export const ForbiddenSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.FORBIDDEN
);

export const ConflictSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.CONFLICT
);

export const ServerErrorSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.SERVER_ERROR
);

export const NotImplementedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.NOT_IMPLEMENTED
);
