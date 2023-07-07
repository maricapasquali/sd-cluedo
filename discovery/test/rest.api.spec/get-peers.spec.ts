import {assert, should as shouldFunc} from 'chai';
import {AxiosInstance, AxiosResponse} from 'axios';
import {RouteName} from 'discovery/src/routes';

const should = shouldFunc();

export default function (
  axiosInstance: AxiosInstance,
  args: {peer: Peer}
): void {
  const {peer} = args;
  it('200 list of peers', async () => {
    try {
      const res: AxiosResponse = await axiosInstance.get(RouteName.PEERS);
      const _peers: Peer[] = res.data;
      _peers.should.deep.contains(peer);
    } catch (err: any) {
      assert.fail(err?.message);
    }
  });
}
