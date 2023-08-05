import {PropType, defineComponent} from 'vue';
import {v4 as uuid} from 'uuid';
import axios, {AxiosResponse} from 'axios';
import {sessionStoreManager} from '@/services/sessionstore';
import {CluedoGames, GamerElements} from '@model';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import routesNames from '@/router/routesNames';

export default defineComponent({
  props: {
    game: {type: Object as PropType<CluedoGame>, required: false},
  },
  emits: ['posted-game', 'posted-gamer'],
  name: 'post-new-game',
  data() {
    return {
      modal: false,
      alert: false,
      loading: false,
      gamer: {identifier: uuid()} as Partial<Gamer>,
      error: {} as AxiosResponse,
    };
  },
  computed: {
    cluedoCharacters() {
      return this.game
        ? Object.values(GamerElements.CharacterName).filter(
            c => !this.game?.gamers.map(g => g.characterToken).includes(c)
          )
        : GamerElements.CharacterName;
    },
  },
  methods: {
    setLocalGame(game: {
      game: {identifier: string; status: string};
      gamer: Gamer;
      accessToken: string;
    }) {
      sessionStoreManager.game = game.game as CluedoGame;
      sessionStoreManager.gamer = game.gamer as Gamer;
      sessionStoreManager.accessToken = game.accessToken;
    },
    postGame() {
      console.debug(this.gamer.username);
      this.loading = true;
      this.alert = false;
      axios
        .post(RestAPIRouteName.GAMES, this.gamer)
        .then(response => {
          console.debug(response.data);
          this.modal = false;
          this.$emit('posted-game', response.data);
          this.setLocalGame({
            game: response.data,
            gamer: this.gamer as Gamer,
            accessToken: response.headers['x-access-token'],
          });
        })
        .catch(err => {
          this.error = err?.response || {};
          console.error(this.error);
          this.alert = true;
        })
        .finally(() => (this.loading = false));
    },
    clickEnterInGame() {
      const gameId = this.game?.identifier || '';
      if (sessionStoreManager.game.identifier === gameId) {
        this.$router.replace({
          name: routesNames.WAITING_ROOM,
          params: {id: gameId},
        });
      } else {
        this.modal = !this.modal;
      }
    },
    enterInGame() {
      const gameId = this.game?.identifier || '';
      axios
        .post(RestAPIRouteName.GAMERS.replace(':id', gameId), this.gamer)
        .then(response => {
          console.debug(response.data);
          this.modal = false;
          this.$emit('posted-gamer', gameId, response.data);
          this.setLocalGame({
            game: {identifier: gameId, status: CluedoGames.Status.WAITING},
            gamer: response.data,
            accessToken: response.headers['x-access-token'],
          });
        })
        .catch(err => {
          console.error(err.response);
          this.error = err;
          this.alert = true;
        })
        .finally(() => (this.loading = false));
    },
  },
});
