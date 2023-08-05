import {createServerStub} from '@utils/socket';

const socket = createServerStub(window.location.origin);

export default socket;
