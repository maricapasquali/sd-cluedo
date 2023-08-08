import {defineComponent} from 'vue';
import axios from 'axios';
import socket from '@/services/socket';
import {sessionStoreManager} from '@/services/sessionstore';
import {CluedoGameEvent} from '@peer/socket/events';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {CluedoGames} from '@model';
import {QueryParameters} from '@peer/routes/parameters';
import routesNames from '@/router/routesNames';

export default defineComponent({
  name: 'WaitingRoom',
  data() {
    const _gameId = this.$router.currentRoute.value.params.id as string;
    return {
      gameId: _gameId,
      loading: true,
      game: {identifier: _gameId, gamers: []} as CluedoGame,
      maxGamers: CluedoGames.MAX_GAMERS,
      minGamers: CluedoGames.MIN_GAMERS,
    };
  },
  methods: {
    onRemovedGamer() {
      this.$router.replace({name: routesNames.HOME});
    },
    getWaitingGame() {
      axios
        .get(RestAPIRouteName.GAME.replace(':id', this.gameId))
        .then(response => {
          console.debug('Game in waiting = ', response.data);
          if (
            !response.data.gamers.find(
              (g: Gamer) =>
                sessionStoreManager.gamer.identifier === g.identifier
            )
          ) {
            this.$router.replace({name: routesNames.HOME});
            return;
          }
          if (response.data.status === CluedoGames.Status.FINISHED) {
            if (
              sessionStoreManager.game.identifier === response.data.identifier
            ) {
              sessionStoreManager.remove();
            }
            this.$router.replace({name: routesNames.HOME});
            return;
          }
          if (response.data.status === CluedoGames.Status.STARTED) {
            this.$router.replace({
              name: routesNames.STARTED_ROOM,
              params: {id: response.data.identifier},
            });
            return;
          }
          this.game = response.data;
          const gamerAuth = {
            gamerId: sessionStoreManager.gamer.identifier,
            gameId: sessionStoreManager.game.identifier,
            accessToken: sessionStoreManager.accessToken,
          };
          socket
            .connectLike(gamerAuth)
            .on('connect', () => {
              console.debug(
                `[WAITING ROOM]: Connect socket with id ${socket.id} and credential `,
                socket.auth
              );
            })
            .on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) => {
              if (message.game === this.game.identifier) {
                this.game.gamers.push(message.gamer);
                console.debug(
                  `ADD NEW GAMER ${message.gamer} IN GAME %s `,
                  message.game
                );
              }
            })
            .on(
              CluedoGameEvent.CLUEDO_REMOVE_GAMER,
              (message: ExitGamerMessage) => {
                if (message.game === this.game.identifier) {
                  const index = this.game.gamers.findIndex(
                    gm => gm.identifier === message.gamer
                  );
                  if (index > -1) {
                    this.game.gamers.splice(index, 1);
                    console.debug(
                      `REMOVE GAMER ${message.gamer} IN GAME %s `,
                      message.game
                    );
                  }
                }
              }
            )
            .on(
              CluedoGameEvent.GameActionEvent.CLUEDO_START.action(
                this.game.identifier
              ),
              (message: CluedoGameMessage) => {
                this.$router.replace({
                  name: routesNames.STARTED_ROOM,
                  params: {id: message.identifier},
                });
              }
            );
        })
        .catch(err => console.error(err))
        .finally(() => (this.loading = false));
    },
    startGame() {
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: QueryParameters.Action.START_GAME,
            },
          }
        )
        .then(response => {
          console.debug(response.data);
          sessionStoreManager.game = response.data;
          this.$router.replace({
            name: routesNames.STARTED_ROOM,
            params: {id: this.game.identifier},
          });
        })
        .catch(err => console.error(err));
    },
  },
  mounted() {
    this.getWaitingGame();
  },
  unmounted() {
    console.debug('unmounted WAITING ROOM');
    socket.off(CluedoGameEvent.CLUEDO_NEW_GAMER);
    socket.off(CluedoGameEvent.CLUEDO_REMOVE_GAMER);
    socket.off(
      CluedoGameEvent.GameActionEvent.CLUEDO_START.action(this.gameId)
    );
  },
});
