<script setup lang="ts">
import { PropType, reactive, watch, ref } from "vue";
import { HistoryItem, localGameStorageManager } from "@/services/localstoragemanager";
import { QueryParameters } from "../../../../src/routes/parameters";
import Action = QueryParameters.Action;
import GamerDescription from "@/components/gamer-description.vue";
import eventbus from "@/eventbus";
import { ACTION_GAMER } from "@/eventbus/eventsName";
import { GamerElements } from "../../../../../libs/model";
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;

const props = defineProps({
  game: {type: Object as PropType<CluedoGame>, required: true}
})

const toasts = ref<{dismissCountDown: number | boolean, body: HistoryItem}[]>([]);

const historyStore = reactive<HistoryItem[]>(localGameStorageManager.history)
function appendInHistory(item: HistoryItem) {
  const _item = {...item, timestamp: Date.now()};
  historyStore.unshift(_item);
  toasts.value.unshift({ dismissCountDown: 5000, body: _item });
}
watch(historyStore, (newHistory) => {
  console.debug('HISTORY STORE',newHistory)
  localGameStorageManager.history = newHistory;
})

function gamer(id: string): Gamer {
  return props.game.gamers.find(g => g.identifier == id) || {} as Gamer;
}
function userName(id: string): string {
  const _gamer = gamer(id);
  if(_gamer.identifier) return `${_gamer.characterToken} (${_gamer.username})`;
  return 'Leaved gamer'
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
  switch (action as QueryParameters.Action) {
    case QueryParameters.Action.ROLL_DIE: {
      const _housePart = typeof message === 'string' ? message: message.housePart;
      return `<b>${_housePart.toUpperCase()}</b>`;
    }

    case QueryParameters.Action.MAKE_ASSUMPTION: {
      const character = message.character || message.suggestion.character;
      const weapon = message.weapon || message.suggestion.weapon;
      const room = message.room || message.suggestion.room;
      return `<ul style="list-style: none"><li>Character: <b>${character}</b></li>` +
        `<li>Weapon: <b>${weapon}</b></li>` +
        `<li>Room: <b>${room}</b></li></ul>.`
    }

    case QueryParameters.Action.MAKE_ACCUSATION: {
      if(message.gamer) {
        const character = message.suggestion.character;
        const weapon = message.suggestion.weapon;
        const room = message.suggestion.room;
        return `<ul style="list-style: none"><li>Character: <b>${character}</b></li>` +
          `<li>Weapon: <b>${weapon}</b></li>` +
          `<li>Room: <b>${room}</b></li></ul>.<br/> Gamer ${message.win ? 'won': 'has lost'}.`
      }
      return `<b>Solution</b>: <ul style="list-style: none"><li>Character: <b>${message.solution.character}</b></li>` +
        `<li>Weapon: <b>${message.solution.weapon}</b></li>` +
        `<li>Room: <b>${message.solution.room}</b></li></ul>. So I ${message.win ? 'won': 'have lost'}`

    }

    case QueryParameters.Action.USE_SECRET_PASSAGE: {
      const _housePart = typeof message === 'string' ? message: message.room;
      return `From ${RoomWithSecretPassage[_housePart].toUpperCase()} to <b>${_housePart.toUpperCase()}</b>`;
    }

    case QueryParameters.Action.CONFUTATION_ASSUMPTION: {
      if((typeof message.card === 'boolean' && !message.card) || (typeof message.card === 'string' && message.card.length === 0)) {
        return`${userName(message.refuterGamer)} doesn't confute assumption`
      } else {
        return `${userName(message.refuterGamer)} confutes assumption of rounded gamer. ${typeof message.card === 'string'? `<br/>Showed card <b>${message.card.toUpperCase()}</b>` :''}`;
      }
    }

    case QueryParameters.Action.END_ROUND:
      return `Next round is of <b>${userName(message)}</b>`

    case QueryParameters.Action.STAY:
      return `Actual roles: <b>${message.roles || message}</b>`;

    case QueryParameters.Action.LEAVE:
      return  `${userName(message.gamer)} leave.<br/>` +
        'New arrangement of cards in my hand ' +
        `<ul style="list-style: none">${message.newDisposition[0].cards.map((card: string) => `<li><b>${card}</b></li>`).join('')}</ul>`

    default:
      return message;
  }
}

eventbus.on(ACTION_GAMER, appendInHistory);
</script>

<template>
  <div class="my-toaster">
    <BAlert v-for="toast in toasts"
            :key="toast.body"
            v-model="toast.dismissCountDown"
            :variant="bgColor(toast.body.action)"
            @close-countdown="console.log($event)" dismissible>
      <BListGroupItem>
        <gamer-description id="history" :gamer="gamer(toast.body.gamer)" />
        <h5>{{toast.body.action.replace('_', ' ').toUpperCase()}}</h5>
        <p v-html="parseMessage(toast.body.action, toast.body.message)"></p>
        <p>{{dateString(toast.body.timestamp)}}</p>
      </BListGroupItem>
    </BAlert>
  </div>

  <BListGroup class="scroll">
    <BListGroupItem v-for="item in historyStore" :variant="bgColor(item.action)">
      <gamer-description id="history" :gamer="gamer(item.gamer)" />
      <h5>{{item.action.replace('_', ' ').toUpperCase()}}</h5>
      <p v-html="parseMessage(item.action, item.message)"></p>
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
.my-toaster {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  opacity: 0.9;
}
</style>
