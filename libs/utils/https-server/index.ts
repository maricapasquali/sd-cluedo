import * as express from 'express';
import {createServer, ServerOptions, Server as HttpsServer} from 'https';
import {RequestHandler} from 'express';
import {Server} from 'socket.io';

export interface HTTPSServerConfig {
  options: ServerOptions;
  uses?: RequestHandler[];
  routes: (app: express.Application) => void;
  sets?: {[key: string]: any};
  additionalOptions?: any;
}
export interface SocketServerConfig {
  options?: Partial<ServerOptions>;
  initSocketHandler: (server: Server) => void;
}

export type HTTPSServerWithSocket = {
  httpsServer: HttpsServer;
  socketServer: Server;
};

export function createHTTPSServer({
  options,
  uses = [],
  routes,
  sets = {},
}: HTTPSServerConfig) {
  const app: express.Application = express();
  uses.forEach(h => app.use(h));
  Object.entries(sets).forEach(([k, v]) => app.set(k, v));
  routes(app);
  return createServer(options, app);
}

export function createHTTPSServerWithSocketServer(
  {options, uses = [], routes, sets = {}}: HTTPSServerConfig,
  {options: socketOptions, initSocketHandler}: SocketServerConfig
): HTTPSServerWithSocket {
  const app: express.Application = express();
  uses.forEach(h => app.use(h));
  const httpsServer = createServer(options, app);
  const socketServer = new Server(httpsServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    ...socketOptions,
  });
  initSocketHandler(socketServer);
  app.set('socket', socketServer);
  Object.entries(sets).forEach(([k, v]) => app.set(k, v));
  routes(app);
  return {httpsServer, socketServer};
}
