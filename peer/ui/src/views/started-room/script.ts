import {defineComponent} from 'vue';
import * as _ from 'lodash';
import axios, {AxiosError} from 'axios';
import socket from '@/services/socket';
import {localStoreManager} from '@/services/localstore';

import {CluedoGames, Gamers} from '@model';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGameEvent} from '@peer/socket/events';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {QueryParameters} from '@peer/routes/parameters';
import Action = QueryParameters.Action;
import routesNames from '@/router/routesNames';
import {BCol, BContainer, BRow} from 'bootstrap-vue-next';

export default defineComponent({
  components: {BRow, BContainer, BCol},
  data() {
    return {
      loading: true,
      reactiveGame: {} as CluedoGame,
    };
  },
  computed: {
    iGamer(): Gamer {
      return (
        this.reactiveGame.gamers?.find(
          (g: Gamer) => g.identifier === localStoreManager.gamer.identifier
        ) || ({} as Gamer)
      );
    },
    amISilent(): boolean {
      return this.iGamer.role?.includes(Gamers.Role.SILENT) || false;
    },
    gameBoardElements(): {name: string}[] {
      return [
        ...(this.reactiveGame.weapons || []),
        ...(this.reactiveGame.rooms || []),
        ...(this.reactiveGame.characters || []),
      ];
    },
  },
  methods: {
    isSilentGamer(gamer: Gamer): boolean | undefined {
      return gamer.role?.includes(Gamers.Role.SILENT);
    },
    connectSocketLikeGamer() {
      const gamerAuth = {
        gamerId: localStoreManager.gamer.identifier,
        gameId: localStoreManager.game.identifier,
        accessToken: localStoreManager.accessToken,
      };
      console.debug('Socket auth ', socket.auth);
      console.debug('gamerAuth ', gamerAuth);
      if (!_.isEqual(socket.auth, gamerAuth)) {
        socket.connectLike(gamerAuth).on('connect', () => {
          console.debug(`Started room: connect socket ${socket.id}`);
        });
      }
    },
    onWriteNotes(note: string | StructuredNoteItem[]) {
      console.debug('onWriteNotes ', note);
      if (this.iGamer.notes) {
        if (typeof note === 'string') {
          this.iGamer.notes.text = note;
          socket.emit(
            CluedoGameEvent.GameActionEvent.CLUEDO_TAKE_NOTES.action(
              this.reactiveGame.identifier
            ),
            {
              gamer: localStoreManager.gamer.identifier,
              note: this.iGamer.notes,
            },
            () => {
              console.debug('Notes updated');
            }
          );
        } else {
          console.debug(JSON.stringify(this.iGamer.notes));
          axios
            .patch(
              RestAPIRouteName.GAME.replace(
                ':id',
                this.reactiveGame.identifier
              ),
              this.iGamer.notes,
              {
                headers: {
                  authorization: localStoreManager.accessToken,
                },
                params: {
                  gamer: localStoreManager.gamer.identifier,
                  action: Action.TAKE_NOTES,
                },
              }
            )
            .then(res => console.debug(res.data))
            .catch(err => console.error(err));
        }
      }
    },
    getStartedGame(gameId: string) {
      axios
        .get(RestAPIRouteName.GAME.replace(':id', gameId), {
          headers: {
            authorization: localStoreManager.accessToken,
          },
          params: {
            status: CluedoGames.Status.STARTED,
          },
        })
        .then(response => {
          console.debug('Game in started = ', response.data);
          if (
            !response.data.gamers.find(
              (g: Gamer) => localStoreManager.gamer.identifier === g.identifier
            )
          ) {
            this.$router.replace({name: routesNames.HOME});
          }
          if (response.data.status === CluedoGames.Status.STARTED) {
            this.$router.replace({
              name: routesNames.STARTED_ROOM,
              params: {id: response.data.identifier},
            });
          }
          this.reactiveGame = response.data;
          this.connectSocketLikeGamer();
        })
        .catch((err: AxiosError) => {
          if (err.response?.status === ResponseStatus.NOT_FOUND) {
            if (
              !localStoreManager.isEmpty() &&
              localStoreManager.game.identifier === gameId
            ) {
              localStoreManager.remove();
            }
            this.$router.replace({name: routesNames.HOME});
          } else {
            console.error(err);
          }
        })
        .finally(() => (this.loading = false));
    },
  },
  watch: {
    reactiveGame: {
      deep: true,
      handler: function (newGame: CluedoGame) {
        console.debug('WATCH GAME ', newGame);
        localStoreManager.game = newGame;
        localStoreManager.gamer = this.iGamer;
      },
    },
  },
  async created() {
    await this.getStartedGame(
      this.$router.currentRoute.value.params.id as string
    );
  },
  unmounted() {
    console.debug('unmounted STARTED ROOM');
    Object.values(CluedoGameEvent.GameActionEvent)
      .map((v: GameActionEvent) => v.action(this.reactiveGame.identifier))
      .forEach(e => socket.off(e));
  },
});
