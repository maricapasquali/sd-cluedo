import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from 'discovery/src/routes';
import {v4 as uuid} from 'uuid';
import {handlerResponseErrorCheck} from './helper';
import {ResponseStatus} from '@utils/rest-api/responses';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;

  it('400 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.PEER, {
        urlParams: {
          id: peer.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('401 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.PEER, {
        headers: {
          'X-Forwarded-For': peer.address,
          authorization: undefined,
        },
        urlParams: {
          id: peer.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.UNAUTHORIZED))
      .then(done)
      .catch(done);
  });

  it('403 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.PEER, {
        headers: {
          'X-Forwarded-For': '192.168.1.2',
        },
        urlParams: {
          id: peer.identifier,
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
      .then(done)
      .catch(done);
  });

  it('404 error', done => {
    axiosInstance
      .delete(RestAPIRouteName.PEER, {
        headers: {
          'X-Forwarded-For': peer.address,
        },
        urlParams: {
          id: uuid(),
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.NOT_FOUND))
      .then(done)
      .catch(done);
  });

  it('200 deleted peer', done => {
    axiosInstance
      .delete(RestAPIRouteName.PEER, {
        headers: {
          'X-Forwarded-For': peer.address,
        },
        urlParams: {
          id: peer.identifier,
        },
      })
      .then(res => {
        res?.status?.should.equal(ResponseStatus.OK);
        const _peer: Peer = res.data;
        _peer.should.deep.equals(peer);
        done();
      })
      .catch(done);
  });
}
