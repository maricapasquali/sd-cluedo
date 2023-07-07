import {NextFunction, Request, Response} from 'express';
import {catchableRequestHandler, ResponseStatus} from '@utils/rest-api';
import * as net from 'net';
import {Peers} from '@model';
import {findPeer} from '../../manager';
import {ITokensManager} from '@utils/jwt.token';

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
    const {status} = req.body;
    if (!status || !Object.values(Peers.Status).includes(status)) {
      res.status(ResponseStatus.BAD_REQUEST).json({
        message:
          'body is wrong. Correct body is {status: ' +
          Object.values(Peers.Status).join('|') +
          '}',
      });
      return ResponseStatus.BAD_REQUEST;
    }
    res.locals = {ipClient, status};
    return;
  });
}

export function handlerNotFoundRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    const {id} = req.params;
    res.locals.peer = findPeer(id);
    if (!res.locals.peer) {
      res.status(ResponseStatus.NOT_FOUND).json({
        message: 'resource ' + id + ' not found',
        cause: 'Not Found',
      });
      return ResponseStatus.NOT_FOUND;
    }
    return;
  });
}

export function handlerUnauthorizedRequest(
  tokenManager: ITokensManager
): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableRequestHandler(next, () => {
      const {id} = req.params;
      const authorization = req.headers['authorization'];
      if (!authorization) {
        res.status(ResponseStatus.UNAUTHORIZED).json({
          message: 'Missing header "authorization"',
          cause: 'unauthenticated',
        });
        return ResponseStatus.UNAUTHORIZED;
      }
      const authorizationSplit = authorization.split(' ');
      if (
        authorizationSplit[0] !== 'Bearer' ||
        !tokenManager.checker(id, authorizationSplit[1])
      ) {
        res.status(ResponseStatus.UNAUTHORIZED).json({
          message: 'token is not a bearer token or it is not present on server',
          cause: 'unauthenticated',
        });
        return ResponseStatus.UNAUTHORIZED;
      }
      res.locals.accessToken = authorizationSplit[1];
      return;
    });
  };
}

export function handlerForbiddenRequest(
  tokenManager: ITokensManager
): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableRequestHandler(next, () => {
      const {ipClient, accessToken, peer} = res.locals;
      if (ipClient !== peer?.address) {
        res.status(ResponseStatus.FORBIDDEN).json({
          message: '"x-forwarded-for" value is different to peer.address',
          cause: 'Forbidden',
        });
        return ResponseStatus.FORBIDDEN;
      }
      if (!tokenManager.validity(peer.identifier, accessToken)) {
        res.status(ResponseStatus.FORBIDDEN).json({
          message:
            'bearer token is not of peer with identifier' + req.params.id,
          cause: 'Forbidden',
        });
        return ResponseStatus.FORBIDDEN;
      }
      return;
    });
  };
}
