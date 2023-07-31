import mitt from 'mitt';
import {ACTION_GAMER, CONFUTATION_CARD} from '@/eventbus/eventsName';
import {HistoryItem} from '@/services/localstoragemanager';
type Events = {
  [CONFUTATION_CARD]: {assumption: Suggestion; card: string};
  [ACTION_GAMER]: HistoryItem;
};
const emitter = mitt<Events>();
export default emitter;
