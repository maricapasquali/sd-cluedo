import {should as shouldFunc} from 'chai';
import {AxiosInstance} from 'axios';
import {RestAPIRouteName} from '@discovery-peers-routes';
import {ResponseStatus} from '@utils/rest-api/responses';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;
  it('200 list of peers', done => {
    axiosInstance
      .get(RestAPIRouteName.PEERS)
      .then(res => {
        res?.status?.should.equal(ResponseStatus.OK);
        const _peers: Peer[] = res.data;
        _peers.should.deep.contains(peer);
        done();
      })
      .catch(done);
  });
}
