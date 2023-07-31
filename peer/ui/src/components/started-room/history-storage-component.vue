<script setup lang="ts">
import { PropType, reactive, watch } from "vue";
import { HistoryItem, localGameStorageManager } from "@/services/localstoragemanager";
import { QueryParameters } from "../../../../src/routes/parameters";
import Action = QueryParameters.Action;
import GamerDescription from "@/components/gamer-description.vue";
import eventbus from "@/eventbus";
import { ACTION_GAMER } from "@/eventbus/eventsName";

const props = defineProps({
  game: {type: Object as PropType<CluedoGame>, required: true}
})

const historyStore = reactive<HistoryItem[]>(localGameStorageManager.history)
function appendInHistory(item: HistoryItem) {
  historyStore.unshift({...item, timestamp: Date.now()})
}
watch(historyStore, (newHistory) => {
  console.debug('HISTORY STORE',newHistory)
  localGameStorageManager.history = newHistory;
})

function gamer(id: string): Gamer {
  return props.game.gamers.find(g => g.identifier == id) || {} as Gamer;
}
function dateString(timestamp: number): string {
  const _date = new Date(timestamp);
  return `${_date.toLocaleDateString()} ${_date.toLocaleTimeString()}`;
}

function bgColor(action: string): string {
  switch (action as QueryParameters.Action) {
    case QueryParameters.Action.ROLL_DIE: return 'primary';
    case QueryParameters.Action.MAKE_ASSUMPTION: return 'warning';
    case QueryParameters.Action.MAKE_ACCUSATION: return 'danger';
    case QueryParameters.Action.USE_SECRET_PASSAGE: return 'info'
    case QueryParameters.Action.CONFUTATION_ASSUMPTION: return 'dark'
    case QueryParameters.Action.END_ROUND: return 'secondary'
    case QueryParameters.Action.STAY: return 'light'
    case QueryParameters.Action.LEAVE: return 'secondary'
    default:
      return '';
  }
}

function parseMessage(action: Action, message: any) {
  //TODO: parse message of history
  return message;
  // switch (action as QueryParameters.Action) {
  //   case QueryParameters.Action.ROLL_DIE: break;
  //   case QueryParameters.Action.MAKE_ASSUMPTION: break;
  //   case QueryParameters.Action.MAKE_ACCUSATION: break;
  //   case QueryParameters.Action.USE_SECRET_PASSAGE: break;
  //   case QueryParameters.Action.CONFUTATION_ASSUMPTION: break;
  //   case QueryParameters.Action.END_ROUND: break;
  //   case QueryParameters.Action.STAY: break;
  //   case QueryParameters.Action.LEAVE: break;
  //   default: break;
  // }
}

eventbus.on(ACTION_GAMER, appendInHistory);
</script>

<template>
  <BListGroup class="scroll">
    <BListGroupItem v-for="item in historyStore" :variant="bgColor(item.action)">
      <gamer-description id="history" :gamer="gamer(item.gamer)" />
      <h5>{{item.action.replace('_', ' ').toUpperCase()}}</h5>
      <p>{{parseMessage(item.action, item.message)}}</p>
      <p>{{dateString(item.timestamp)}}</p>
    </BListGroupItem>
  </BListGroup>
</template>

<style scoped>
.scroll {
  max-height: 500px;
  overflow-x: hidden;
  overflow-y: auto;
  text-align: center;
  padding: 20px;
}
</style>
