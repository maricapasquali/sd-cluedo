import * as express from 'express';
import * as controller from './controller';
import * as middleware from './middleware';
import {pathNotFound, serverError} from '@utils/rest-api/middlewares';
import * as serveStatic from 'serve-static';
import * as path from 'path';
import {RestAPIRouteName} from './routesNames';

type RouteConfig = {
  peer: Peer;
};
export default function ({
  peer,
}: RouteConfig): (app: express.Application) => void {
  return (app: express.Application) => {
    if (process.env.NODE_ENV === 'production') {
      app.use(serveStatic(path.resolve('..', 'build', 'peer', 'ui', 'dist')));
    }

    app
      .route(RestAPIRouteName.GAMES)
      .post(
        middleware.games.handlerBadRequest,
        controller.restApi.postGames(peer)
      )
      .get(middleware.games.handlerBadRequest, controller.restApi.getGames);

    app
      .route(RestAPIRouteName.GAME)
      .get(
        middleware.games.handlerBadRequest,
        middleware.games.handlerNotFoundRequest,
        middleware.games.extractAccessToken,
        controller.restApi.getGame
      )
      .patch(
        middleware.games.handlerBadRequest,
        middleware.games.handlerNotFoundRequest,
        middleware.games.handlerUnauthorizedRequest,
        middleware.games.handlerForbiddenRequest,
        middleware.games.handlerGoneRequest,
        controller.restApi.patchGame
      );

    app
      .route(RestAPIRouteName.GAMERS)
      .post(
        middleware.games.handlerNotFoundRequest,
        middleware.gamers.handlerBadRequest,
        middleware.gamers.handlerGoneRequest,
        controller.restApi.postGamers(peer)
      );

    app
      .route(RestAPIRouteName.GAMER)
      .delete(
        middleware.gamers.handlerNotFoundRequest,
        middleware.gamers.handlerUnauthorizedRequest,
        middleware.gamers.handlerForbiddenRequest,
        middleware.gamers.handlerGoneRequest,
        controller.restApi.deleteGamer
      );

    app.use(serverError);

    app.use(pathNotFound);
  };
}
