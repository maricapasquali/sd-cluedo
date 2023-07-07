import {NextFunction, Request, Response} from 'express';
import {catchableRequestHandler, ResponseStatus} from '@utils/rest-api';
import * as net from 'net';
import * as Checkers from '@model/checker';
import {ValidationError} from 'runtypes';
import {findPeer} from '../../manager';

export function handlerBadRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    const ipClient = xForwardedFor?.split(',')[0].trim();
    if (!ipClient || ipClient.length === 0) {
      res.status(ResponseStatus.BAD_REQUEST).json({
        message: 'Missing header "x-forwarded-for"',
        cause: 'Bad request',
      });
      return ResponseStatus.BAD_REQUEST;
    }
    if (!net.isIPv4(ipClient)) {
      res.status(ResponseStatus.BAD_REQUEST).json({
        message: '"x-forwarded-for" value is not a ipv4',
        cause: 'Bad request',
      });
      return ResponseStatus.BAD_REQUEST;
    }
    const peer = req.body;
    try {
      Checkers.CPeer.check(peer);
    } catch (err: any) {
      res.status(ResponseStatus.BAD_REQUEST).json({
        message: 'body is not a peer instance',
        cause: (err as ValidationError).details,
      });
      return ResponseStatus.BAD_REQUEST;
    }
    res.locals = {ipClient, peer};
    return;
  });
}

export function handlerForbiddenRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    const {ipClient, peer} = res.locals;
    if (ipClient !== peer.address) {
      res.status(ResponseStatus.FORBIDDEN).json({
        message: '"x-forwarded-for" value is different to body.address',
        cause: 'Forbidden',
      });
      return ResponseStatus.FORBIDDEN;
    }
    return;
  });
}

export function handlerConflictRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    const {peer} = res.locals;
    if (findPeer(peer.identifier)) {
      res
        .status(ResponseStatus.CONFLICT)
        .json({message: 'current peer already exists', cause: 'Conflict'});
      return ResponseStatus.CONFLICT;
    }
    return;
  });
}
