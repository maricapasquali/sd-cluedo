import * as express from 'express';
import * as controller from './controller';
import * as middleware from './middleware';
import {pathNotFound, serverError} from '@utils/rest-api/middlewares';
export enum RestAPIRouteName {
  GAMES = '/api/v1/games',
  GAME = '/api/v1/games/:id',
  GAMERS = '/api/v1/games/:id/gamers',
  GAMER = '/api/v1/games/:id/gamers/:gamerId',
}

export enum PeerRouteName {
  BASE = '/',
}
export default function (app: express.Application): void {
  app.route(PeerRouteName.BASE).get(controller.baseHandler);

  app
    .route(RestAPIRouteName.GAMES)
    .post(middleware.games.handlerBadRequest, controller.restApi.postGames)
    .get(middleware.games.handlerBadRequest, controller.restApi.getGames);

  app
    .route(RestAPIRouteName.GAME)
    .get(
      middleware.games.handlerBadRequest,
      middleware.games.handlerNotFoundRequest,
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
      controller.restApi.postGamers
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
}
