import {defineComponent} from 'vue';
import * as _ from 'lodash';
import axios, {AxiosError} from 'axios';
import socket from '@/services/socket';
import {sessionStoreManager} from '@/services/sessionstore';

import {CluedoGames, Gamers} from '@model';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {ResponseStatus} from '@utils/rest-api/responses';
import {CluedoGameEvent} from '@peer/socket/events';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {QueryParameters} from '@peer/routes/parameters';
import Action = QueryParameters.Action;
import routesNames from '@/router/routesNames';

export default defineComponent({
  data() {
    return {
      loading: true,
      reactiveGame: {} as CluedoGame,
    };
  },
  computed: {
    iGamer(): Gamer | Partial<Gamer> {
      return (
        this.reactiveGame.gamers?.find(
          (g: Gamer) => g.identifier === sessionStoreManager.gamer.identifier
        ) || ({notes: {text: '', structuredNotes: []}} as Partial<Gamer>)
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
        gamerId: sessionStoreManager.gamer.identifier,
        gameId: sessionStoreManager.game.identifier,
        accessToken: sessionStoreManager.accessToken,
      };
      if (!_.isEqual(socket.auth, gamerAuth)) {
        socket.connectLike(gamerAuth).on('connect', () => {
          console.debug(
            `[STARTED ROOM]: Connect socket with id ${socket.id} and credential `,
            socket.auth
          );
        });
      }
    },
    unsetSessionStorage(gameId: string) {
      if (
        !sessionStoreManager.isEmpty() &&
        sessionStoreManager.game.identifier === gameId
      ) {
        sessionStoreManager.remove();
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
              gamer: sessionStoreManager.gamer.identifier,
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
                  authorization: sessionStoreManager.accessToken,
                },
                params: {
                  gamer: sessionStoreManager.gamer.identifier,
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
            authorization: sessionStoreManager.accessToken,
          },
          params: {
            status: CluedoGames.Status.STARTED,
          },
        })
        .then(response => {
          console.debug('Game in started = ', response.data);
          if (
            !response.data.gamers.find(
              (g: Gamer) =>
                sessionStoreManager.gamer.identifier === g.identifier
            )
          ) {
            this.unsetSessionStorage(gameId);
            this.$router.replace({name: routesNames.HOME});
            return;
          }
          this.reactiveGame = response.data;
        })
        .catch((err: AxiosError) => {
          if (err.response?.status === ResponseStatus.NOT_FOUND) {
            this.unsetSessionStorage(gameId);
            this.$router.replace({name: routesNames.HOME});
            return;
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
        sessionStoreManager.game = newGame;
        sessionStoreManager.gamer = this.iGamer as Gamer;
      },
    },
  },
  mounted() {
    this.connectSocketLikeGamer();
    const gameId = (this.$router.currentRoute.value.params.id || '') as string;
    this.getStartedGame(gameId);
  },
  unmounted() {
    console.debug('unmounted STARTED ROOM');
    Object.values(CluedoGameEvent.GameActionEvent)
      .map((v: GameActionEvent) => v.action(this.reactiveGame.identifier))
      .forEach(e => socket.off(e));
  },
});
