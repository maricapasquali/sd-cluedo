import {Response} from 'express';

/**
 * It represents a generic message error.
 */
export interface MessageError {
  /**
   * Message error.
   */
  message: string;
  /**
   * (Optional) Cause of the error.
   */
  cause?: string | object | any;
  /**
   * (Optional) Code of the error.
   */
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
  GONE = 410,
  SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}

export interface ResponseSender {
  /**
   * Status of http[s] response.
   */
  status: ResponseStatus;

  /**
   * Send a JSON response.
   * @param res response object.
   * @param payload object to send.
   */
  json(res: Response, payload: MessageError | any): ResponseStatus;

  /**
   * Send a TEXT/PLAIN response.
   * @param res response object.
   * @param payload string to send.
   */
  text(res: Response, payload: string): ResponseStatus;
}

/**
 * Implementation of _{@link ResponseSender}_.
 */
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

  text(res: Response, payload: string): ResponseStatus {
    res.header('content-type', 'text/plain').status(this.status).send(payload);
    return this.status;
  }
}

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.CREATED}.
 */
export const CreatedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.CREATED
);
/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.OK}.
 */
export const OkSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.OK
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.BAD_REQUEST}.
 */
export const BadRequestSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.BAD_REQUEST
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.NOT_FOUND}.
 */
export const NotFoundSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.NOT_FOUND
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.UNAUTHORIZED}.
 */
export const UnauthorizedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.UNAUTHORIZED
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.FORBIDDEN}.
 */
export const ForbiddenSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.FORBIDDEN
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.CONFLICT}.
 */
export const ConflictSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.CONFLICT
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.GONE}.
 */
export const GoneSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.GONE
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.SERVER_ERROR}.
 */
export const ServerErrorSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.SERVER_ERROR
);

/**
 * Instantiation of _{@link BasicResponseSender}_ with response status {@link ResponseStatus.NOT_IMPLEMENTED}.
 */
export const NotImplementedSender: ResponseSender = BasicResponseSender.create(
  ResponseStatus.NOT_IMPLEMENTED
);
