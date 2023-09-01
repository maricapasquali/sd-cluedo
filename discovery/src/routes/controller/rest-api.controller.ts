import {Response, Request, NextFunction} from 'express';
import DiscoveryPeersManager from '../../managers/peers';
import {CreatedSender, OkSender} from '@utils/rest-api/responses';
import {AppGetter, catchableHandlerRequestPromise} from '@utils/rest-api';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';

export function postPeer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {peer} = res.locals;
    DiscoveryPeersManager.addPeer(peer);
    const accessToken: string = AppGetter.tokensManger(req).createToken(
      peer.identifier,
      peer
    );
    AppGetter.socketServer(req)?.emit(
      DiscoveryPeerEvent.PEER,
      peer as PeerMessage
    );
    return CreatedSender.json(
      res.setHeader('x-access-token', ['Bearer', accessToken].join(' ')),
      {newPeer: peer, peers: DiscoveryPeersManager.peers}
    );
  })
    .then(next)
    .catch(next);
}

export function getPeers(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    return OkSender.json(res, DiscoveryPeersManager.peers);
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
    DiscoveryPeersManager.updatePeer(peer.identifier, req.body.status);
    peer.status = req.body.status;
    AppGetter.socketServer(req)?.emit(
      DiscoveryPeerEvent.PEER,
      peer as PeerMessage
    );
    return OkSender.json(res, peer);
  })
    .then(next)
    .catch(next);
}

export function deletePeer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  catchableHandlerRequestPromise(() => {
    const {peer} = res.locals;
    DiscoveryPeersManager.removePeer(peer.identifier);
    AppGetter.tokensManger(req).removeToken(peer.identifier);
    AppGetter.socketServer(req)?.emit(
      DiscoveryPeerEvent.PEER_DELETE,
      peer as PeerMessage
    );
    return OkSender.json(res, peer);
  })
    .then(next)
    .catch(next);
}
