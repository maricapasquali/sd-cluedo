import {NextFunction, Request, Response} from 'express';
import {
  catchableHandlerRequestPromise,
  HeadersFormatter,
} from '@utils/rest-api';
import {
  BadRequestSender,
  ConflictSender,
  ForbiddenSender,
} from '@utils/rest-api/responses';
import * as net from 'net';
import * as Checkers from '@model/checker';
import {ValidationError} from 'runtypes';
import PeersManager from '../../managers/peers';

export function handlerBadRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const ipClient = HeadersFormatter.clientIp(req);
    if (!ipClient) {
      return BadRequestSender.json(res, {
        message: 'Missing header "x-forwarded-for"',
      });
    }
    if (!net.isIPv4(ipClient)) {
      return BadRequestSender.json(res, {
        message: '"x-forwarded-for" value is not a ipv4',
      });
    }
    const peer = req.body;
    try {
      Checkers.CPeer.check(peer);
    } catch (err: any) {
      return BadRequestSender.json(res, {
        message: 'body is not a peer instance',
        cause: (err as ValidationError).details,
      });
    }
    res.locals = {ipClient, peer};
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerForbiddenRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {ipClient, peer} = res.locals;
    if (ipClient !== peer.address) {
      return ForbiddenSender.json(res, {
        message: '"x-forwarded-for" value is different to body.address',
      });
    }
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerConflictRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {peer} = res.locals;
    if (PeersManager.findPeer(peer.identifier)) {
      return ConflictSender.json(res, {message: 'current peer already exists'});
    }
    return;
  })
    .then(next)
    .catch(next);
}
