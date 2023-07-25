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
import mongoose from 'mongoose';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import * as os from 'os';
import createPeerClientStub from './socket/server';
import {Peers} from '@model';
import * as ip from 'ip';
import Protocol = Peers.Protocol;
import {v4 as uuid} from 'uuid';
import {PeerServerManager} from './managers/peers-servers';
import {connectAndListenOnDiscoveryServer} from './socket/client';
import {createServerStub} from '@utils/socket';
import {machineIdSync} from 'node-machine-id';

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

const httpsOptions = {
  key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
  cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
};

const peersSockets = new PeerServerManager();

const serverConfig: HTTPSServerConfig = {
  options: httpsOptions,
  uses: [express.json(), express.query({}), loggerHttp],
  routes,
  sets: {
    tokensManager: BasicTokenManager.create({
      issuer: 'https://' + os.hostname() + ':' + externalPort,
      publicKey: httpsOptions.cert,
      privateKey: httpsOptions.key,
    }),
    peerServerManager: peersSockets,
  },
};

const myPeer = {
  identifier:
    process.env.NODE_ENV === 'production' ? machineIdSync(true) : uuid(),
  protocol: Protocol.HTTPS,
  hostname: os.hostname(),
  port: externalPort,
  address: ip.address(),
  status: Peers.Status.ONLINE,
};

logger.debug(myPeer);

const discoveryServerSocketClient = createServerStub(discoveryServerAddress, {
  auth: {
    peerId: myPeer.identifier,
  },
});

const socketConfig: SocketServerConfig = {
  initSocketHandler: createPeerClientStub(myPeer, {
    peerServerManager: peersSockets,
    discoveryServerSocketClient,
  }),
};

const {httpsServer, socketServer} = createHTTPSServerWithSocketServer(
  serverConfig,
  socketConfig
);

httpsServer
  .listen(internalPort, () => {
    logger.info('Listen on ' + internalPort);

    connectAndListenOnDiscoveryServer(discoveryServerSocketClient, {
      myPeer,
      mySocketServer: socketServer,
      discoveryServerAddress,
      peerServerManager: peersSockets,
    });

    if (process.env.ENV_CI === 'CI/CD') {
      discoveryServerSocketClient.disconnect();
      socketServer.close(() => logger.info('Close socket server'));
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
