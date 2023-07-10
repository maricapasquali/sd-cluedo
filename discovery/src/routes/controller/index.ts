import {Response, Request, NextFunction} from 'express';
import {addPeer, peers, updatePeer, removePeer} from '../../manager';
import {CreatedSender, OkSender} from '@utils/rest-api/responses';
import {ITokensManager} from '@utils/jwt.token';
import {catchableHandlerRequestPromise} from '@utils/rest-api';
import {NamespaceEvent} from '../../socket';

export function postPeer(tokenManager: ITokensManager): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableHandlerRequestPromise(() => {
      const {peer} = res.locals;
      addPeer(peer);
      const accessToken: string = tokenManager.createToken(
        peer.identifier,
        peer
      );
      req.app.get('socket')?.emit(NamespaceEvent.PEER, peer as PeerMessage);
      return CreatedSender.json(
        res.setHeader('x-access-token', ['Bearer', accessToken].join(' ')),
        {newPeer: peer, peers: peers()}
      );
    })
      .then(next)
      .catch(next);
  };
}

export function getPeers(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    return OkSender.json(res, peers());
  })
    .then(next)
    .catch(next);
}

export function updateStatusPeer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {peer} = res.locals;
    updatePeer(peer.identifier, req.body.status);
    peer.status = req.body.status;
    req.app.get('socket')?.emit(NamespaceEvent.PEER, peer as PeerMessage);
    return OkSender.json(res, peer);
  })
    .then(next)
    .catch(next);
}

export function deletePeer(tokenManager: ITokensManager): Middleware {
  return (req: Request, res: Response, next: NextFunction) => {
    catchableHandlerRequestPromise(() => {
      const {peer} = res.locals;
      removePeer(peer.identifier);
      tokenManager.removeToken(peer.identifier);
      req.app
        .get('socket')
        ?.emit(NamespaceEvent.PEER_DELETE, peer as PeerMessage);
      return OkSender.json(res, peer);
    })
      .then(next)
      .catch(next);
  };
}
