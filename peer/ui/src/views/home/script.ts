import {defineComponent} from 'vue';
import axios from 'axios';
import {localStoreManager} from '@/services/localstore';
import socket from '@/services/socket';
import routesNames from '@/router/routesNames';
import {CluedoGames} from '@model';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {CluedoGameEvent} from '@peer/socket/events';

export default defineComponent({
  name: 'Home',
  data() {
    return {
      games: [] as CluedoGame[],
      loading: true,
      noInGame: localStoreManager.isEmpty(),
      filteredStatus: '' as '' | CluedoGames.Status,
      optionsStatus: [
        {value: '', text: 'NO FILTER'},
        ...Object.values(CluedoGames.Status).map(s => ({
          value: s,
          text: s.toUpperCase(),
        })),
      ],
    };
  },
  computed: {
    CluedoGames() {
      return CluedoGames;
    },
    filteredGames(): CluedoGame[] {
      return this.filteredStatus.length > 0
        ? this.games.filter((g: CluedoGame) => g.status === this.filteredStatus)
        : this.games;
    },
  },
  watch: {
    noInGame(v) {
      if (v) {
        console.debug('Remove game in localStorage');
        localStoreManager.remove();
      }
    },
  },
  methods: {
    onPostedGame(game: CluedoGame) {
      this.games.push(game);
      this.$router.replace({
        name: routesNames.WAITING_ROOM,
        params: {id: game.identifier},
      });
    },
    onPostedGamer(game: string, gamer: Gamer) {
      const fGame: CluedoGame | undefined = this.games.find(
        (g: CluedoGame) => g.identifier === game
      );
      if (fGame) {
        fGame.gamers.push(gamer);
        this.$router.replace({
          name: routesNames.WAITING_ROOM,
          params: {id: fGame.identifier},
        });
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
          this.noInGame = true;
        }
      }
    },
    inGame(game: string): boolean {
      return localStoreManager.game.identifier === game;
    },
    goTo(game: CluedoGame) {
      this.$router.replace({
        name:
          game.status === CluedoGames.Status.STARTED
            ? routesNames.STARTED_ROOM
            : routesNames.WAITING_ROOM,
        params: {id: game.identifier},
      });
    },
    getGames() {
      axios
        .get(RestAPIRouteName.GAMES)
        .then(response => {
          console.debug(response);
          if (!localStoreManager.isEmpty()) {
            const game = response.data.find(
              (g: CluedoGame) =>
                g.identifier === localStoreManager.game.identifier &&
                g.gamers.find(
                  gm => gm.identifier === localStoreManager.gamer.identifier
                )
            );
            console.debug('My game', game);
            if (game) this.goTo(game);
            else this.noInGame = true;
          }
          this.games = response.data;
          (this.games as (CluedoGame & {createdAt: string})[]).sort(
            (g1, g2) => Date.parse(g2.createdAt) - Date.parse(g1.createdAt)
          );
          this.games.forEach(g => this.handlerSocketSingleGame(g.identifier));
        })
        .catch(err => {
          console.error(err);
        })
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
  created() {
    socket
      .connectLike()
      .on('connect', () => {
        console.debug('Connect socket with id ' + socket.id);
      })
      .on(CluedoGameEvent.CLUEDO_NEW_GAME, (game: CluedoGame) => {
        this.games.unshift(game);
        this.handlerSocketSingleGame(game.identifier);
        console.debug('ADD NEW WAITING GAME ', game);
      })
      .on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) => {
        this.games
          .find(g => g.identifier === message.game)
          ?.gamers.push(message.gamer);
        console.debug(
          `ADD NEW GAMER ${message.gamer} IN GAME %s `,
          message.game
        );
      })
      .on(CluedoGameEvent.CLUEDO_REMOVE_GAMER, (message: ExitGamerMessage) => {
        const game = this.games.find(g => g.identifier === message.game);
        if (game) {
          const index =
            game?.gamers.findIndex(gm => gm.identifier === message.gamer) || -1;
          if (index > -1) {
            game.gamers.splice(index, 1);
            console.debug(
              `REMOVE GAMER ${message.gamer} IN GAME %s `,
              message.game
            );
          }
        }
      });
    this.getGames();
  },
  unmounted() {
    console.debug('UNMOUNTED ', this.games);
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
