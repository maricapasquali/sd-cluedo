import {NextFunction, Request, Response} from 'express';
import {
  AppGetter,
  catchableHandlerRequestPromise,
  HeadersFormatter,
} from '@utils/rest-api';
import * as net from 'net';
import {Peers} from '@model';
import DiscoveryPeersManager from '../../managers/peers';

import {
  BadRequestSender,
  ForbiddenSender,
  NotFoundSender,
  UnauthorizedSender,
} from '@utils/rest-api/responses';

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
        cause: 'Bad request',
      });
    }
    if (!net.isIPv4(ipClient)) {
      return BadRequestSender.json(res, {
        message: '"x-forwarded-for" value is not a ipv4',
      });
    }
    const {status} = req.body;
    if (!status || !Object.values(Peers.Status).includes(status)) {
      return BadRequestSender.json(res, {
        message:
          'body is wrong. Correct body is {status: ' +
          Object.values(Peers.Status).join('|') +
          '}',
      });
    }
    res.locals = {ipClient, status};
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerNotFoundRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {id} = req.params;
    res.locals.peer = DiscoveryPeersManager.findPeer(id);
    if (!res.locals.peer) {
      return NotFoundSender.json(res, {
        message: 'resource ' + id + ' not found',
      });
    }
    return;
  })
    .then(next)
    .catch(next);
}

export function handlerUnauthorizedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return UnauthorizedSender.json(res, {
        message: 'Missing header "authorization"',
      });
    }
    const {scheme, parameters} = HeadersFormatter.authorization(req);
    if (
      scheme !== 'Bearer' ||
      !AppGetter.tokensManger(req).checker(parameters)
    ) {
      return UnauthorizedSender.json(res, {
        message: 'token is not a bearer token or it is not present on server',
      });
    }
    res.locals.accessToken = parameters;
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
    const {ipClient, accessToken, peer} = res.locals;
    if (ipClient !== peer?.address) {
      return ForbiddenSender.json(res, {
        message: '"x-forwarded-for" value is different to peer.address',
      });
    }
    if (!AppGetter.tokensManger(req).validity(peer.identifier, accessToken)) {
      return ForbiddenSender.json(res, {
        message: 'bearer token is not of peer with identifier' + req.params.id,
      });
    }
    return;
  })
    .then(next)
    .catch(next);
}
