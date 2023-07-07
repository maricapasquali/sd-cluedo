import {Response, Request, NextFunction} from 'express';
import {addPeer, peers, updatePeer, removePeer} from '../../../src/manager';
import {catchableRequestHandler, ResponseStatus} from '@utils/rest-api';
import {ITokensManager} from '@utils/jwt.token';

export function postPeer(tokenManager: ITokensManager): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableRequestHandler(next, () => {
      const {peer} = res.locals;
      addPeer(peer);
      const accessToken: string = tokenManager.createToken(
        peer.identifier,
        peer
      );
      res
        .setHeader('x-access-token', ['Bearer', accessToken].join(' '))
        .status(ResponseStatus.CREATED)
        .json({newPeer: peer, peers: peers()});
      return ResponseStatus.CREATED;
    });
  };
}

export function getPeers(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    res.status(ResponseStatus.OK).json(peers());
    return ResponseStatus.OK;
  });
}

export function updateStatusPeer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableRequestHandler(next, () => {
    const {peer} = res.locals;
    updatePeer(peer.identifier, req.body.status);
    peer.status = req.body.status;
    res.status(ResponseStatus.OK).json(peer);
    return ResponseStatus.OK;
  });
}

export function deletePeer(tokenManager: ITokensManager): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableRequestHandler(next, () => {
      const {peer} = res.locals;
      removePeer(peer.identifier);
      tokenManager.removeToken(peer.identifier);
      res.status(ResponseStatus.OK).json(peer);
      return ResponseStatus.OK;
    });
  };
}
