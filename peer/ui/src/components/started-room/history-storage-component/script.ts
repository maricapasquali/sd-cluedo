import {PropType, defineComponent} from 'vue';
import {HistoryItem, localStoreManager} from '@/services/localstore';
import eventbus from '@/eventbus';
import {ACTION_GAMER} from '@/eventbus/eventsName';
import {QueryParameters} from '@peer/routes/parameters';
import Action = QueryParameters.Action;
import {GamerElements} from '@model';
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;

export default defineComponent({
  props: {
    game: {type: Object as PropType<CluedoGame>, required: true},
  },
  name: 'history-storage-component',
  data() {
    return {
      toasts: [] as {dismissCountDown: number | boolean; body: HistoryItem}[],
      historyStore: localStoreManager.history,
    };
  },
  watch: {
    historyStore: {
      deep: true,
      handler: function (newHistory) {
        console.debug('HISTORY STORE', newHistory);
        localStoreManager.history = newHistory;
      },
    },
  },
  methods: {
    appendInHistory(item: HistoryItem) {
      const _item = {...item, timestamp: Date.now()};
      this.historyStore.unshift(_item);
      this.toasts.unshift({dismissCountDown: 5000, body: _item});
    },
    gamer(id: string): Gamer {
      return this.game.gamers?.find(g => g.identifier === id) || ({} as Gamer);
    },
    userName(id: string): string {
      const _gamer = this.gamer(id);
      if (_gamer.identifier)
        return `${_gamer.characterToken} (${_gamer.username})`;
      return 'Leaved gamer';
    },
    dateString(timestamp: number): string {
      const _date = new Date(timestamp);
      return `${_date.toLocaleDateString()} ${_date.toLocaleTimeString()}`;
    },
    bgColor(action: string): string {
      switch (action as QueryParameters.Action) {
        case QueryParameters.Action.ROLL_DIE:
          return 'primary';
        case QueryParameters.Action.MAKE_ASSUMPTION:
          return 'warning';
        case QueryParameters.Action.MAKE_ACCUSATION:
          return 'danger';
        case QueryParameters.Action.USE_SECRET_PASSAGE:
          return 'info';
        case QueryParameters.Action.CONFUTATION_ASSUMPTION:
          return 'dark';
        case QueryParameters.Action.END_ROUND:
          return 'secondary';
        case QueryParameters.Action.STAY:
          return 'light';
        case QueryParameters.Action.LEAVE:
          return 'secondary';
        default:
          return '';
      }
    },
    parseMessage(action: Action, message: any) {
      switch (action as QueryParameters.Action) {
        case QueryParameters.Action.ROLL_DIE: {
          const _housePart =
            typeof message === 'string' ? message : message.housePart;
          return `<b>${_housePart.toUpperCase()}</b>`;
        }

        case QueryParameters.Action.MAKE_ASSUMPTION: {
          const character = message.character || message.suggestion.character;
          const weapon = message.weapon || message.suggestion.weapon;
          const room = message.room || message.suggestion.room;
          return (
            `<ul style="list-style: none"><li>Character: <b>${character}</b></li>` +
            `<li>Weapon: <b>${weapon}</b></li>` +
            `<li>Room: <b>${room}</b></li></ul>.`
          );
        }

        case QueryParameters.Action.MAKE_ACCUSATION: {
          if (message.gamer) {
            const character = message.suggestion.character;
            const weapon = message.suggestion.weapon;
            const room = message.suggestion.room;
            return (
              `<ul style="list-style: none"><li>Character: <b>${character}</b></li>` +
              `<li>Weapon: <b>${weapon}</b></li>` +
              `<li>Room: <b>${room}</b></li></ul>.<br/> Gamer ${
                message.win ? 'won' : 'has lost'
              }.`
            );
          }
          return (
            `<b>Solution</b>: <ul style="list-style: none"><li>Character: <b>${message.solution.character}</b></li>` +
            `<li>Weapon: <b>${message.solution.weapon}</b></li>` +
            `<li>Room: <b>${message.solution.room}</b></li></ul>. So I ${
              message.win ? 'won' : 'have lost'
            }`
          );
        }

        case QueryParameters.Action.USE_SECRET_PASSAGE: {
          const _housePart =
            typeof message === 'string' ? message : message.room;
          return `From ${RoomWithSecretPassage[
            _housePart
          ].toUpperCase()} to <b>${_housePart.toUpperCase()}</b>`;
        }

        case QueryParameters.Action.CONFUTATION_ASSUMPTION: {
          if (
            (typeof message.card === 'boolean' && !message.card) ||
            (typeof message.card === 'string' && message.card.length === 0)
          ) {
            return `${this.userName(
              message.refuterGamer
            )} doesn't confute assumption`;
          } else {
            return `${this.userName(
              message.refuterGamer
            )} confutes assumption of rounded gamer. ${
              typeof message.card === 'string'
                ? `<br/>Showed card <b>${message.card.toUpperCase()}</b>`
                : ''
            }`;
          }
        }

        case QueryParameters.Action.END_ROUND:
          return `Next round is of <b>${this.userName(message)}</b>`;

        case QueryParameters.Action.STAY:
          return `Actual roles: <b>${message.roles || message}</b>`;

        case QueryParameters.Action.LEAVE:
          return (
            `${this.userName(message.gamer)} leave.<br/>` +
            'New arrangement of cards in my hand ' +
            `<ul style="list-style: none">${message.newDisposition[0].cards
              .map((card: string) => `<li><b>${card}</b></li>`)
              .join('')}</ul>`
          );

        default:
          return message;
      }
    },
  },
  mounted() {
    eventbus.on(ACTION_GAMER, this.appendInHistory);
  },
  unmounted() {
    eventbus.off(ACTION_GAMER, this.appendInHistory);
  },
});
