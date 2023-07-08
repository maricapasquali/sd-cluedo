import * as express from 'express';
import {Response, Request, NextFunction} from 'express';
import * as controller from './controller';
import * as middleware from './middleware';
import {logger} from '@utils/logger';
import {ITokensManager} from '@utils/jwt.token';
import {NotFoundSender, ServerErrorSender} from '@utils/rest-api/responses';

export enum RouteName {
  PEERS = '/api/v1/peers',
  PEER = '/api/v1/peers/:id',
}

export default function (
  app: express.Application,
  tokensManger: ITokensManager
): void {
  app
    .route(RouteName.PEERS)
    .post(
      middleware.post.handlerBadRequest,
      middleware.post.handlerForbiddenRequest,
      middleware.post.handlerConflictRequest,
      controller.postPeer(tokensManger)
    )
    .get(controller.getPeers);

  app
    .route(RouteName.PEER)
    .patch(
      middleware.patch.handlerBadRequest,
      middleware.patch.handlerNotFoundRequest,
      middleware.patch.handlerUnauthorizedRequest(tokensManger),
      middleware.patch.handlerForbiddenRequest(tokensManger),
      controller.updateStatusPeer
    )
    .delete(
      middleware.remove.handlerBadRequest,
      middleware.remove.handlerNotFoundRequest,
      middleware.remove.handlerUnauthorizedRequest(tokensManger),
      middleware.remove.handlerForbiddenRequest(tokensManger),
      controller.deletePeer(tokensManger)
    );

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err?.stack || err);
    ServerErrorSender.json(res, {
      message: 'Server Error',
      cause: err?.stack || err,
    });
  });

  app.use((req: Request, res: Response) => {
    logger.debug(req);
    NotFoundSender.json(res, {
      message: req.method + ' ' + req.path + ' not found',
      cause: 'wrong path or wrong method',
    });
  });
}
