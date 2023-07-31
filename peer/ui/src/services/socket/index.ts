// eslint-disable-next-line node/no-unpublished-import
import {createServerStub} from '../../../../../libs/utils/socket';

const socket = createServerStub(window.location.origin);

export default socket;
