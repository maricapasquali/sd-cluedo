import {defineComponent} from 'vue';
import axios from 'axios';
import {sessionStoreManager} from '@/services/sessionstore';
import socket from '@/services/socket';
import routesNames from '@/router/routesNames';
import {CluedoGame} from '@model';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {CluedoGameEvent} from '@peer/socket/events';

export default defineComponent({
  name: 'Home',
  data() {
    return {
      games: [] as CluedoGame[],
      loading: true,
      filteredStatus: CluedoGame.Status.WAITING,
      optionsStatus: [
        {value: '', text: 'NO FILTER'},
        ...Object.values(CluedoGame.Status).map(s => ({
          value: s,
          text: s.toUpperCase(),
        })),
      ],
    };
  },
  computed: {
    CluedoGame() {
      return CluedoGame;
    },
    filteredGames(): CluedoGame[] {
      return this.filteredStatus.length > 0
        ? this.games.filter((g: CluedoGame) => g.status === this.filteredStatus)
        : this.games;
    },
  },
  methods: {
    onPostedGame(game: CluedoGame, iEnterInGame = true) {
      if (!this.games.find(g => g.identifier === game.identifier)) {
        this.games.unshift(game);
        console.debug('ADD NEW WAITING GAME ', game);
      }
      if (iEnterInGame) {
        this.$router.replace({
          name: routesNames.WAITING_ROOM,
          params: {id: game.identifier},
        });
      }
    },
    onPostedGamer(game: string, gamer: Gamer, isOther = false) {
      const fGame: CluedoGame | undefined = this.games.find(
        (g: CluedoGame) => g.identifier === game
      );
      if (fGame) {
        const _gamer = fGame.gamers.find(
          (gm: Gamer) => gm.identifier === gamer.identifier
        );
        if (!_gamer) {
          fGame.gamers.push(gamer);
          console.debug(
            'ADD NEW GAMER %s IN GAME %s',
            JSON.stringify(gamer),
            game
          );
        }
        if (!isOther) {
          this.$router.replace({
            name: routesNames.WAITING_ROOM,
            params: {id: fGame.identifier},
          });
        }
      }
    },
    onRemoveGamer(game: string, gamer: string) {
      const _game = this.games.find((g: CluedoGame) => g.identifier === game);
      if (_game) {
        const fGameIndex: number = _game.gamers.findIndex(
          gm => gm.identifier === gamer
        );
        if (fGameIndex > -1) {
          _game.gamers.splice(fGameIndex, 1);
          console.debug('REMOVE GAMER %s IN GAME %s', gamer, game);
        }
      }
    },
    getGames() {
      axios
        .get(RestAPIRouteName.GAMES)
        .then(response => {
          console.debug(response);
          console.debug('Init home');
          this.games = response.data;
          (this.games as (CluedoGame & {createdAt: string})[]).sort(
            (g1, g2) => Date.parse(g2.createdAt) - Date.parse(g1.createdAt)
          );
          this.games.forEach(g => this.handlerSocketSingleGame(g.identifier));
        })
        .catch(err => console.error(err))
        .finally(() => (this.loading = false));
    },
    handlerSocketSingleGame(gameId: string): void {
      const game =
        this.games.find(g => g.identifier === gameId) || ({} as CluedoGame);
      const handler = (message: CluedoGameMessage) => {
        Object.assign(game, message);
      };
      socket.on(
        CluedoGameEvent.GameActionEvent.CLUEDO_START.action(gameId),
        handler
      );
      socket.on(
        CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(gameId),
        handler
      );
    },
  },
  beforeCreate() {
    if (!sessionStoreManager.isEmpty()) {
      console.debug('My game', sessionStoreManager.game);
      this.$router.replace({
        name:
          sessionStoreManager.game.status === CluedoGame.Status.STARTED
            ? routesNames.STARTED_ROOM
            : routesNames.WAITING_ROOM,
        params: {id: sessionStoreManager.game.identifier},
      });
      return;
    }
  },
  mounted() {
    socket
      .connectLike()
      .on('connect', () => {
        console.debug('[HOME]: Connect socket with id ' + socket.id);
      })
      .on(CluedoGameEvent.CLUEDO_NEW_GAME, (game: CluedoGame) => {
        this.onPostedGame(game, false);
        this.handlerSocketSingleGame(game.identifier);
      })
      .on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) =>
        this.onPostedGamer(message.game, message.gamer, true)
      )
      .on(CluedoGameEvent.CLUEDO_REMOVE_GAMER, (message: ExitGamerMessage) =>
        this.onRemoveGamer(message.game, message.gamer)
      );
    this.getGames();
    console.debug('current route ', this.$router.currentRoute.value);
  },
  unmounted() {
    console.debug('unmounted HOME');
    socket.off(CluedoGameEvent.CLUEDO_NEW_GAME);
    socket.off(CluedoGameEvent.CLUEDO_NEW_GAMER);
    socket.off(CluedoGameEvent.CLUEDO_REMOVE_GAMER);
    this.games.forEach(g => {
      socket.off(
        CluedoGameEvent.GameActionEvent.CLUEDO_START.action(g.identifier)
      );
      socket.off(
        CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(g.identifier)
      );
    });
  },
});
