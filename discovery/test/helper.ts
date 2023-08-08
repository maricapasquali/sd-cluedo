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
import {RestAPIRouteName} from '@discovery-peers-routes';
import routes from '../src/routes';
import {BasicTokenManager} from '@utils/tokens-manager/basic';
import handlerSocket from '../src/socket';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import {Socket} from 'socket.io-client';
import {createAxiosInstance} from '@utils/axios';
import {createServerStub} from '@utils/socket';

function getHttpsConfig(port: number): HTTPSServerConfig {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve('sslcert', 'privatekey.pem')),
    cert: fs.readFileSync(path.resolve('sslcert', 'cert.pem')),
  };
  return {
    options: httpsOptions,
    uses: [express.json(), loggerHttp],
    routes,
    sets: {
      tokensManager: BasicTokenManager.create({
        issuer: 'https://localhost:' + port,
        publicKey: httpsOptions.cert,
        privateKey: httpsOptions.key,
      }),
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
  return createHTTPSServerWithSocketServer(serverConfig, socketConfig);
}

export function mocksPeerServer(): Server {
  return createHTTPSServer({
    options: {
      key: fs.readFileSync(path.resolve('test', 'assets', 'privatekey.pem')),
      cert: fs.readFileSync(path.resolve('test', 'assets', 'cert.pem')),
    },
    routes: app => {
      app.get('/', (req, res) => res.send());
    },
  });
}

type MocksPeerClientOptions = {
  discoveryServerAddress: string;
  nConnectedDevice?: number;
};
export function mocksPeerClient(
  i: number,
  {discoveryServerAddress, nConnectedDevice}: MocksPeerClientOptions
) {
  const peer: Peer = {
    identifier: uuid(),
    protocol: Peers.Protocol.HTTPS,
    address: '127.0.0.' + (i + 1),
    port: 3000 + (i + 1),
    status: Peers.Status.ONLINE,
    hostname: 'localhost',
  };
  const clientPeer = createServerStub(discoveryServerAddress, {
    auth: {
      peerId: peer.identifier,
      nConnectedDevice,
    },
  });
  return {
    peer,
    post: createAxiosInstance({baseURL: discoveryServerAddress}).post(
      RestAPIRouteName.PEERS,
      peer,
      {
        headers: {'x-forwarded-for': peer.address},
      }
    ),
    connection: new Promise<Socket>((resolve, reject) => {
      clientPeer
        .connect()
        .on('connect', () => resolve(clientPeer))
        .on('connect_error', reject);
    }),
  };
}
