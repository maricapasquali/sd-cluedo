import {NextFunction, Request, Response} from 'express';
import {NotImplementedSender} from '@utils/rest-api/responses';

export * as restApi from './rest-api.controller';

export function baseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}
