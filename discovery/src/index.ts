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

const port: number = Number(process.env.PORT) || 3000;

logger.debug('Discovery Server: index.ts');
logger.debug('port = ' + port);

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
      issuer: 'https://' + os.hostname() + ':' + port,
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
  .listen(port, () => {
    logger.info('Listen on ' + port);
    if (process.env.ENV_CI === 'CI/CD') {
      httpsServer.close(() => {
        logger.info('Close server');
      });
    }
  })
  .on('error', err => {
    logger.error(err);
  });
