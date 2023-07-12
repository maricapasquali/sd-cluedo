import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {logger, loggerHttp} from '@utils/logger';
import {HTTPSServerConfig} from '@utils/https-server';
import routes from './routes';
import createTokenManager from './managers/tokens';
import {
  createHTTPSServerWithSocketServer,
  SocketServerConfig,
} from '@utils/https-server';
import handlerSocket from './socket';

const internalPort: number = Number(process.env.PORT) || 3000;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;

logger.debug('Discovery Server: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);

const serverConfig: HTTPSServerConfig = {
  options: {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  },
  uses: [express.json(), loggerHttp],
  routes,
  sets: {
    tokensManager: createTokenManager(
      'https://' + os.hostname() + ':' + externalPort
    ),
  },
};

const socketConfig: SocketServerConfig = {
  initSocketHandler: handlerSocket,
};

const {httpsServer} = createHTTPSServerWithSocketServer(
  serverConfig,
  socketConfig
);

httpsServer
  .listen(internalPort, () => {
    logger.info('Listen on ' + internalPort);
    if (process.env.ENV_CI === 'CI/CD') {
      httpsServer.close(() => {
        logger.info('Close server');
      });
    }
  })
  .on('error', err => {
    logger.error(err);
  });
