import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {logger, loggerHttp} from '@utils/logger';
import {HTTPSServerConfig} from '@utils/https-server';
import routes from './routes';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
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

const httpsOptions = {
  key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
  cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
};

const serverConfig: HTTPSServerConfig = {
  options: httpsOptions,
  uses: [express.json(), loggerHttp],
  routes,
  sets: {
    tokensManager: BasicTokenManager.create({
      issuer: 'https://' + os.hostname() + ':' + externalPort,
      privateKey: httpsOptions.key,
      publicKey: httpsOptions.cert,
    }),
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
