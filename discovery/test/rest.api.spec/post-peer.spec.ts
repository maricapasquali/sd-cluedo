import {assert, should as shouldFunc} from 'chai';
import {AxiosInstance, AxiosResponse} from 'axios';
import {RouteName} from 'discovery/src/routes';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;
  it('201 created', async () => {
    try {
      axiosInstance.interceptors.response.use(response => {
        axiosInstance.defaults.headers['authorization'] =
          response.headers['x-access-token'];
        return response;
      });
      const res: AxiosResponse = await axiosInstance.post(
        RouteName.PEERS,
        peer,
        {
          headers: {
            'X-Forwarded-For': peer.address,
          },
        }
      );
      res?.status?.should.equal(201);
      const accessToken = res.headers['x-access-token'] as string;
      should.exist(accessToken);
      accessToken.should.be.contains('Bearer');
      const _peers: Peer[] = res.data;
      _peers.should.contains(peer);
    } catch (err: any) {
      assert.fail(err?.message);
    }
  });

  it('400 error', done => {
    axiosInstance
      .post(RouteName.PEERS, peer)
      .then(done)
      .catch(err => {
        if (err?.response?.status === 400) {
          done();
        } else {
          done(err);
        }
      });
  });

  it('403 error', done => {
    axiosInstance
      .post(RouteName.PEERS, peer, {
        headers: {
          'X-Forwarded-For': '192.168.1.2',
        },
      })
      .then(done)
      .catch(err => {
        if (err?.response?.status === 403) {
          done();
        } else {
          done(err);
        }
      });
  });

  it('409 error', done => {
    axiosInstance
      .post(RouteName.PEERS, peer, {
        headers: {
          'X-Forwarded-For': peer.address,
        },
      })
      .then(done)
      .catch(err => {
        if (err?.response?.status === 409) {
          done();
        } else {
          done(err);
        }
      });
  });
}
