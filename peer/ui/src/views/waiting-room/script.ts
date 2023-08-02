import {defineComponent} from 'vue';
import axios from 'axios';
import socket from '@/services/socket';
import {localStoreManager} from '@/services/localstore';
import {CluedoGameEvent} from '@peer/socket/events';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {CluedoGames} from '@model';
import {QueryParameters} from '@peer/routes/parameters';
import routesNames from '@/router/routesNames';

export default defineComponent({
  name: 'WaitingRoom',
  data() {
    return {
      gameId: this.$router.currentRoute.value.params.id as string,
      loading: true,
      game: {} as CluedoGame,
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
              (g: Gamer) => localStoreManager.gamer.identifier === g.identifier
            )
          ) {
            this.$router.replace({name: routesNames.HOME});
            return;
          }
          if (response.data.status === CluedoGames.Status.FINISHED) {
            if (
              localStoreManager.game.identifier === response.data.identifier
            ) {
              localStoreManager.remove();
            }
            this.$router.replace({name: routesNames.HOME});
            return;
          }
          if (response.data.status === CluedoGames.Status.STARTED) {
            this.$router.replace({
              name: routesNames.STARTED_ROOM,
              params: {id: response.data.identifier},
            });
          }
          this.game = response.data;
          const gamerAuth = {
            gamerId: localStoreManager.gamer.identifier,
            gameId: localStoreManager.game.identifier,
            accessToken: localStoreManager.accessToken,
          };
          socket
            .connectLike(gamerAuth)
            .on('connect', () => {
              console.debug(
                `RECONNECT ${socket.id} UPDATE CREDENTIAL `,
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
                  const index =
                    this.game.gamers.findIndex(
                      gm => gm.identifier === message.gamer
                    ) || -1;
                  if (index > -1) {
                    this.game.gamers.splice(index, 1);
                    console.debug(
                      `REMOVE GAMER ${message.gamer} IN GAME %s `,
                      message.game
                    );
                    if (localStoreManager.gamer.identifier === message.gamer) {
                      this.$router.replace({
                        name: routesNames.WAITING_ROOM,
                        params: {id: message.game},
                      });
                    }
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
              authorization: localStoreManager.accessToken,
            },
            params: {
              gamer: localStoreManager.gamer.identifier,
              action: QueryParameters.Action.START_GAME,
            },
          }
        )
        .then(response => {
          console.debug(response.data);
          localStoreManager.game = response.data;
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
      CluedoGameEvent.GameActionEvent.CLUEDO_START.action(this.game.identifier)
    );
  },
});
