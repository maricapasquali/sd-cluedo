import * as express from 'express';
import * as controller from './controller';

export enum RouteName {
  PEERS = '/peers',
  PEER = '/peers/:id',
}

export default function (app: express.Application): void {
  app.route(RouteName.PEERS).post(controller.postPeer).get(controller.getPeers);

  app
    .route(RouteName.PEER)
    .patch(controller.updateStatusPeer)
    .delete(controller.deletePeer);
}
