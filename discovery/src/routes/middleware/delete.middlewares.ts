import {NextFunction, Request, Response} from 'express';
import {
  catchableHandlerRequestPromise,
  HeadersFormatter,
} from '@utils/rest-api';
import * as net from 'net';
import {findPeer} from '../../manager';
import {ITokensManager} from '@utils/jwt.token';
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
      });
    }
    if (!net.isIPv4(ipClient)) {
      return BadRequestSender.json(res, {
        message: '"x-forwarded-for" value is not a ipv4',
      });
    }
    res.locals = {ipClient};
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
    res.locals.peer = findPeer(id);
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
  tokenManager: ITokensManager
): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableHandlerRequestPromise(() => {
      const {id} = req.params;
      const authorization = req.headers.authorization;
      if (!authorization) {
        return UnauthorizedSender.json(res, {
          message: 'Missing header "authorization"',
        });
      }
      const {scheme, parameters} = HeadersFormatter.authorization(req);
      if (scheme !== 'Bearer' || !tokenManager.checker(id, parameters)) {
        return UnauthorizedSender.json(res, {
          message: 'token is not a bearer token or it is not present on server',
        });
      }
      res.locals.accessToken = parameters;
      return;
    })
      .then(next)
      .catch(next);
  };
}

export function handlerForbiddenRequest(
  tokenManager: ITokensManager
): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableHandlerRequestPromise(() => {
      const {ipClient, accessToken, peer} = res.locals;
      if (ipClient !== peer?.address) {
        return ForbiddenSender.json(res, {
          message: '"x-forwarded-for" value is different to peer.address',
        });
      }
      if (!tokenManager.validity(peer.identifier, accessToken)) {
        return ForbiddenSender.json(res, {
          message:
            'bearer token is not of peer with identifier' + req.params.id,
        });
      }
      return;
    })
      .then(next)
      .catch(next);
  };
}
