import * as express from 'express';
import * as controller from './controller';
import * as middleware from './middleware';

export enum RestAPIRouteName {
  PEERS = '/api/v1/peers',
  PEER = '/api/v1/peers/:id',
}

export default function (app: express.Application): void {
  app
    .route(RestAPIRouteName.PEERS)
    .post(
      middleware.post.handlerBadRequest,
      middleware.post.handlerForbiddenRequest,
      middleware.post.handlerConflictRequest,
      controller.restApi.postPeer
    )
    .get(controller.restApi.getPeers);

  app
    .route(RestAPIRouteName.PEER)
    .patch(
      middleware.patch.handlerBadRequest,
      middleware.patch.handlerNotFoundRequest,
      middleware.patch.handlerUnauthorizedRequest,
      middleware.patch.handlerForbiddenRequest,
      controller.restApi.updateStatusPeer
    )
    .delete(
      middleware.remove.handlerBadRequest,
      middleware.remove.handlerNotFoundRequest,
      middleware.remove.handlerUnauthorizedRequest,
      middleware.remove.handlerForbiddenRequest,
      controller.restApi.deletePeer
    );

  app.use(controller.serverError);

  app.use(controller.pathNotFound);
}
