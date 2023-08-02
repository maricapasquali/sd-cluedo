import {PropType, defineComponent} from 'vue';
import {v4 as uuid} from 'uuid';
import axios, {AxiosError} from 'axios';
import {localStoreManager} from '@/services/localstore';
import {GamerElements} from '@model';
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
      error: {} as Partial<AxiosError>,
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
      game: {identifier: string};
      gamer: Gamer;
      accessToken: string;
    }) {
      localStoreManager.game = game.game as CluedoGame;
      localStoreManager.gamer = game.gamer as Gamer;
      localStoreManager.accessToken = game.accessToken;
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
            game: {identifier: response.data.identifier},
            gamer: this.gamer as Gamer,
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
    clickEnterInGame() {
      const gameId = this.game?.identifier || '';
      if (localStoreManager.game.identifier === gameId) {
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
            game: {identifier: gameId},
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
