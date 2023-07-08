import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {logger, loggerHttp} from '@utils/logger';
import createHTTPSServer, {HTTPSServerConfig} from '@utils/https-server';
import routes from './routes';
import createTokenManager from './token-manager';

const internalPort: number = Number(process.env.PORT) || 3000;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;

logger.debug('Discovery Server: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);

export const serverConfig: HTTPSServerConfig = {
  options: {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  },
  uses: [express.json(), loggerHttp],
  routes,
  routesArgs: [
    createTokenManager('https://' + os.hostname() + ':' + externalPort),
  ],
};

const httpsServer = createHTTPSServer(serverConfig);
httpsServer.listen(internalPort, () => {
  logger.debug('Listen on ' + internalPort);
  if (process.env.ENV_CI === 'CI/CD') {
    httpsServer.close(() => {
      logger.debug('Close server');
    });
  }
});
