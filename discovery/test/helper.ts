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
import routes, {RestAPIRouteName} from '../src/routes';
import createTokenManager from '../src/managers/tokens';
import handlerSocket from '../src/socket';
import {ResponseStatus} from '@utils/rest-api/responses';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';
import {io as Client, Socket} from 'socket.io-client';
import {createAxiosInstance} from '@utils/axios';

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

export function handlerResponseErrorCheck(
  err: any,
  status: ResponseStatus
): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((err?.response?.status as ResponseStatus) === status) {
      resolve();
    } else {
      reject(err);
    }
  });
}

type PromiseHandler = (resolve: any, reject: any) => any;

export function promises<T>(
  array: any[],
  handler: (item: any, index: number) => PromiseHandler
): Promise<T>[] {
  const _promises: Promise<T>[] = [];
  array.forEach((item, index) =>
    _promises.push(new Promise<T>(handler(item, index)))
  );
  return _promises;
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
    hostname: 'host-' + (i + 1),
  };
  const clientPeer = Client(discoveryServerAddress, {
    secure: true,
    autoConnect: false,
    rejectUnauthorized: false,
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
