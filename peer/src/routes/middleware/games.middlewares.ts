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

export function handlerUnauthorizedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next();
}

export function handlerForbiddenRequest(
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
