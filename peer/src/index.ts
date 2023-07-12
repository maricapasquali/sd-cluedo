import {logger} from '@utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import {loggerHttp} from '@utils/logger';
import {
  createHTTPSServerWithSocketServer,
  HTTPSServerConfig,
  SocketServerConfig,
} from '@utils/https-server';
import routes from './routes';
import sockets from './socket';
import mongoose from 'mongoose';

const internalPort: number = Number(process.env.PORT) || 3001;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;
const discoveryServerAddress: string =
  process.env.DISCOVERY_SERVER_ADDRESS || 'https://localhost:3000';
const mongodbAddress: string =
  process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo';

logger.debug('Peer: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);
logger.debug('discoveryServerAddress = ' + discoveryServerAddress);
logger.debug('mongodbAddress = ' + mongodbAddress);

mongoose.connect(mongodbAddress).then(
  () => logger.info('Database is connected.'),
  err => logger.error(err, 'Connection database fail.\n')
);

const serverConfig: HTTPSServerConfig = {
  options: {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  },
  uses: [express.json(), loggerHttp],
  routes,
  sets: {
    tokensManager: null,
  },
};

const socketConfig: SocketServerConfig = {
  initSocketHandler: sockets.handlerSocketServer,
};

const {httpsServer} = createHTTPSServerWithSocketServer(
  serverConfig,
  socketConfig
);

httpsServer
  .listen(internalPort, () => {
    logger.info('Listen on ' + internalPort);

    //TODO:
    // 1) connect (socket) to discovery server
    // 1) post (rest api) myself to discovery server

    if (process.env.ENV_CI === 'CI/CD') {
      httpsServer.close(() => {
        logger.info('Close server');
        mongoose
          .disconnect()
          .then(() => logger.info('Database is disconnected.'))
          .catch(err => logger.error(err, 'Disconnection database fail.'));
      });
    }
  })
  .on('error', err => {
    logger.error(err);
    mongoose
      .disconnect()
      .then(() => logger.info('Database is disconnected.'))
      .catch(err => logger.error(err, 'Disconnection database fail.'));
  });
