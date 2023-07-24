import {NextFunction, Request, Response} from 'express';
import {logger} from '../logger';
import {NotFoundSender, ServerErrorSender} from './responses';

export function serverError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(err?.stack || err);
  ServerErrorSender.json(res, {
    message: 'Server Error',
    cause: err?.stack || err,
  });
}

export function pathNotFound(req: Request, res: Response): void {
  logger.debug(req);
  NotFoundSender.json(res, {
    message: req.method + ' ' + req.path + ' not found',
    cause: 'wrong path or wrong method',
  });
}
