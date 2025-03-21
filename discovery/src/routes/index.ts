import * as express from 'express';
import * as controller from './controller';
import * as middleware from './middleware';
import {serverError, pathNotFound} from '@utils/rest-api/middlewares';
import {DiscoveryRouteName, RestAPIRouteName} from '@discovery-peers-routes';

export default function (app: express.Application): void {
  app.route(DiscoveryRouteName.BASE).get(controller.baseHandler);

  app
    .route(RestAPIRouteName.PEERS)
    .post(
      middleware.post.handlerBadRequest,
      middleware.post.handlerForbiddenRequest,
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

  app.use(serverError);

  app.use(pathNotFound);
}
