import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '@discovery-peers-routes';
import {handlerResponseErrorCheck} from '@utils/test-helper';
import {ResponseStatus} from '@utils/rest-api/responses';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;

  it('201 created', done => {
    axiosInstance
      .post(RestAPIRouteName.PEERS, peer, {
        headers: {
          'X-Forwarded-For': peer.address,
        },
      })
      .then(res => {
        res?.status?.should.equal(ResponseStatus.CREATED);
        const accessToken = res.headers['x-access-token'] as string;
        should.exist(accessToken);
        accessToken.should.be.contains('Bearer');
        const _peers: Peer[] = res.data?.peers;
        _peers.should.deep.contains(peer);
        done();
      })
      .catch(done);
  });

  it('400 error', done => {
    axiosInstance
      .post(RestAPIRouteName.PEERS, peer)
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.BAD_REQUEST))
      .then(done)
      .catch(done);
  });

  it('403 error', done => {
    axiosInstance
      .post(RestAPIRouteName.PEERS, peer, {
        headers: {
          'X-Forwarded-For': '192.168.1.2',
        },
      })
      .then(done)
      .catch(err => handlerResponseErrorCheck(err, ResponseStatus.FORBIDDEN))
      .then(done)
      .catch(done);
  });
}
