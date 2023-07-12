import {NotImplementedSender} from '@utils/rest-api/responses';
import {NextFunction, Request, Response} from 'express';

export function postGames(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function getGames(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function getGame(req: Request, res: Response, next: NextFunction): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function patchGame(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function deleteGame(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function postGamers(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}

export function deleteGamer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  NotImplementedSender.json(res, {message: 'not implemented'});
}
