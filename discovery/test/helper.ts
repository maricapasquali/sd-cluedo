import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import {Server} from 'https';
import {loggerHttp} from '@utils/logger';
import {
  createHTTPSServer,
  createHTTPSServerWithSocketServer,
  HTTPSServerConfig,
  HTTPSServerWithSocket,
  SocketServerConfig,
} from '@utils/https-server';
import routes from '../src/routes';
import createTokenManager from '../src/managers/tokens';
import handlerSocket from '../src/socket';

function getHttpsConfig(port: number): HTTPSServerConfig {
  return {
    options: {
      key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
      cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
    },
    uses: [express.json(), loggerHttp],
    routes,
    sets: {
      tokensManager: createTokenManager('https://localhost:' + port),
    },
  };
}
export function createAndUpDiscoveryServer(port: number): Server {
  return createHTTPSServer(getHttpsConfig(port));
}

export function createDiscoveryServerWithSocketServer(
  port: number
): HTTPSServerWithSocket {
  const serverConfig: HTTPSServerConfig = getHttpsConfig(port);
  const socketConfig: SocketServerConfig = {
    initSocketHandler: handlerSocket,
  };
  const httpsServerWithSocket = createHTTPSServerWithSocketServer(
    serverConfig,
    socketConfig
  );
  return httpsServerWithSocket;
}
