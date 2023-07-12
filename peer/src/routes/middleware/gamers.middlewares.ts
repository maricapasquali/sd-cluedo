import {NextFunction, Request, Response} from 'express';

export function handlerBadRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next();
}

export function handlerNotFoundRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next();
}
export function handlerConflictRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next();
}
