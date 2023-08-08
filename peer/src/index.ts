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
import Protocol = Peers.Protocol;
import {v4 as uuid} from 'uuid';
import {PeerServerManager} from './managers/peers-servers';
import {connectAndListenOnDiscoveryServer} from './socket/client';
import {createServerStub} from '@utils/socket';
import {machineIdSync} from 'node-machine-id';
import * as history from 'connect-history-api-fallback';
import * as dns from 'dns';

const port: number = Number(process.env.PORT) || 3001;
const discoveryServerAddress: string =
  process.env.DISCOVERY_SERVER_ADDRESS || 'https://localhost:3000';
const mongodbAddress: string =
  process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017/cluedo';

logger.debug('Peer: index.ts');
logger.debug('port = ' + port);
logger.debug('discoveryServerAddress = ' + discoveryServerAddress);
logger.debug('mongodbAddress = ' + mongodbAddress);

dns.resolve4(os.hostname(), (err, addresses) => {
  if (err) {
    return logger.error(err);
  }

  const myPeer = {
    identifier:
      process.env.NODE_ENV === 'production' ? machineIdSync(true) : uuid(),
    protocol: Protocol.HTTPS,
    hostname: os.hostname(),
    port: port,
    address: addresses[0],
    status: Peers.Status.ONLINE,
  };

  logger.debug(myPeer);

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
    uses: [express.json(), express.text(), loggerHttp, history()],
    routes,
    sets: {
      tokensManager: BasicTokenManager.create({
        issuer: Peers.url(myPeer),
        publicKey: httpsOptions.cert,
        privateKey: httpsOptions.key,
      }),
      peerServerManager: peersSockets,
    },
  };

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
    .listen(port, () => {
      logger.info('Listen on ' + port);

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
});
