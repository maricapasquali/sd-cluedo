import {logger, loggerHttp} from '@utils/logger';
import * as express from 'express';
import {createServer} from 'https';
import * as path from 'path';
import * as fs from 'fs';
import {Server} from 'https';
import routes from './routes';
import * as os from 'os';
import createTokenManager from './token-manager';

const internalPort: number = Number(process.env.PORT) || 3000;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;

logger.debug('Discovery Server: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);

const app = express();
app.use(express.json());
app.use(loggerHttp);

routes(
  app,
  createTokenManager('https://' + os.hostname() + ':' + externalPort)
);

const httsServer: Server = createServer(
  {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  },
  app
);

httsServer.listen(internalPort, () => {
  logger.debug('Listen on ' + internalPort);
  if (process.env.ENV_CI === 'CI/CD') httsServer.close();
});

export default httsServer;
