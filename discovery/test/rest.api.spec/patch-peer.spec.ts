import {assert, should as shouldFunc} from 'chai';
import {AxiosInstance, AxiosResponse} from 'axios';
import {RouteName} from 'discovery/src/routes';
import {v4 as uuid} from 'uuid';
import {Peers} from '@model';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;

  it('200 updated peer', async () => {
    try {
      const res: AxiosResponse = await axiosInstance.patch(
        RouteName.PEER,
        {status: Peers.Status.SHAREABLE},
        {
          headers: {
            'X-Forwarded-For': peer.address,
          },
          urlParams: {
            id: peer.identifier,
          },
        }
      );
      const _peer: Peer = res.data;
      _peer.should.have.property('status').equal(Peers.Status.SHAREABLE);
      peer.status = Peers.Status.SHAREABLE;
    } catch (err: any) {
      assert.fail(err?.message);
    }
  });

  it('400 error', done => {
    axiosInstance
      .patch(
        RouteName.PEER,
        {status: 'stopped'},
        {
          headers: {
            'X-Forwarded-For': peer.address,
          },
          urlParams: {
            id: peer.identifier,
          },
        }
      )
      .then(done)
      .catch(err => {
        if (err?.response?.status === 400) {
          done();
        } else {
          done(err);
        }
      });
  });

  it('401 error', done => {
    axiosInstance
      .patch(
        RouteName.PEER,
        {status: Peers.Status.ONLINE},
        {
          headers: {
            'X-Forwarded-For': peer.address,
            authorization: undefined,
          },
          urlParams: {
            id: peer.identifier,
          },
        }
      )
      .then(done)
      .catch(err => {
        if (err?.response?.status === 401) {
          done();
        } else {
          done(err);
        }
      });
  });

  it('403 error', done => {
    axiosInstance
      .patch(
        RouteName.PEER,
        {status: Peers.Status.ONLINE},
        {
          headers: {
            'X-Forwarded-For': '192.168.1.2',
          },
          urlParams: {
            id: peer.identifier,
          },
        }
      )
      .then(done)
      .catch(err => {
        if (err?.response?.status === 403) {
          done();
        } else {
          done(err);
        }
      });
  });

  it('404 error', done => {
    axiosInstance
      .patch(
        RouteName.PEER,
        {status: Peers.Status.ONLINE},
        {
          headers: {
            'X-Forwarded-For': peer.address,
          },
          urlParams: {
            id: uuid(),
          },
        }
      )
      .then(done)
      .catch(err => {
        if (err?.response?.status === 404) {
          done();
        } else {
          done(err);
        }
      });
  });
}
