import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '@discovery-peers-routes';
import {v4 as uuid} from 'uuid';
import {Peer} from '@model';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;

  it('200 updated peer', done => {
    axiosInstance
      .patch(
        RestAPIRouteName.PEER,
        {status: Peer.Status.OFFLINE},
        {
          headers: {
            'X-Forwarded-For': peer.address,
          },
          urlParams: {
            id: peer.identifier,
          },
        }
      )
      .then(res => {
        res?.status?.should.equal(ResponseStatus.OK);
        const _peer: Peer = res.data;
        _peer.should.have.property('status').equal(Peer.Status.OFFLINE);
        peer.status = Peer.Status.OFFLINE;
        done();
      })
      .catch(done);
  });

  it('400 error', done => {
    axiosInstance
      .patch(
        RestAPIRouteName.PEER,
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('401 error', done => {
    axiosInstance
      .patch(
        RestAPIRouteName.PEER,
        {status: Peer.Status.ONLINE},
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED))
      .then(done)
      .catch(done);
  });

  it('403 error', done => {
    axiosInstance
      .patch(
        RestAPIRouteName.PEER,
        {status: Peer.Status.ONLINE},
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
      .then(done)
      .catch(done);
  });

  it('404 error', done => {
    axiosInstance
      .patch(
        RestAPIRouteName.PEER,
        {status: Peer.Status.ONLINE},
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
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });
}
