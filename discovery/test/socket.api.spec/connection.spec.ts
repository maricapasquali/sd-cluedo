import {io as Client, Socket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {AxiosResponse} from 'axios';
import {mocksPeerClient} from '../helper';

type ConnectionSpecOptions = {
  discoveryServerAddress: string;
  socketPeers: Socket[];
};

export default function ({
  discoveryServerAddress,
  socketPeers,
}: ConnectionSpecOptions): void {
  const nClients = 5;

  it('connect some peer', done => {
    const posts: Promise<AxiosResponse>[] = [];
    const connections: Promise<Socket>[] = [];
    for (let i = 0; i < nClients; i++) {
      const {post, connection} = mocksPeerClient(i, {discoveryServerAddress});
      posts.push(post);
      connections.push(connection);
    }
    Promise.all(connections)
      .then((res: Socket[]) => {
        socketPeers.push(...res);
        logger.debug(socketPeers.map(s => s.id));
        return Promise.all(posts);
      })
      .then(res => {
        logger.debug(res.map(r => r.status));
        done();
      })
      .catch(done);
  });

  it("if the parameter 'auth.peerId' is missing in the handshake, it should get a connect_error", done => {
    const client = Client(discoveryServerAddress, {
      secure: true,
      autoConnect: false,
      rejectUnauthorized: false,
      auth: {},
    });
    client
      .connect()
      .once('connect', () => done(new Error('peer is connected')))
      .once('connect_error', reason => {
        logger.debug(reason);
        done();
      });
  });
}
