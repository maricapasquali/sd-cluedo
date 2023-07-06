import {logger} from '@utils/logger';
import * as express from 'express';
import {createServer} from 'https';
import * as path from 'path';
import * as fs from 'fs';
import {Server} from 'https';
import routes from './routes';

const internalPort: number = Number(process.env.PORT) || 3000;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;

logger.debug('Discovery Server: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);

const app = express();
app.use(express.json());

routes(app);

const httsServer: Server = createServer(
  {
    key: fs.readFileSync(
      path.join(__dirname, '..', 'sslcert', 'privatekey.pem')
    ),
    cert: fs.readFileSync(path.join(__dirname, '..', 'sslcert', 'cert.pem')),
  },
  app
);

httsServer.listen(internalPort, () =>
  logger.debug('Listen on ' + internalPort)
);

export default httsServer;
