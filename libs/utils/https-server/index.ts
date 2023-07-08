import * as express from 'express';
import {createServer, ServerOptions} from 'https';

import {RequestHandler} from 'express';
export interface HTTPSServerConfig {
  options: ServerOptions;
  uses?: RequestHandler[];
  routes: (app: express.Application, ...args: any) => void;
  routesArgs: any[];
  additionalOptions?: any;
}
export default function (config: HTTPSServerConfig) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {options, uses = [], routes, routesArgs, additionalOptions} = config;
  const app: express.Application = express();
  uses.forEach(h => app.use(h));
  routes(app, ...routesArgs);
  return createServer(options, app);
}
