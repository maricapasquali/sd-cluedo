<script setup lang="ts">
import axios, { AxiosError } from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { CluedoGames, Gamers } from "../../../../libs/model";
import router from "@/router";
import { computed, defineComponent, reactive, ref, watch } from "vue";
import { ResponseStatus } from "../../../../libs/utils/rest-api/responses";
import GamerDescription from "@/components/gamer-description.vue";
import GameBoard from "@/components/started-room/game-board.vue";
import OperationsGameComponent from "@/components/started-room/gamer-actions/operations-game-component.vue";
import NoteStructuredComponent from "@/components/started-room/note-structured-component.vue";
import HistoryStorageComponent from "@/components/started-room/history-storage-component.vue";
import { localGameStorageManager } from "@/services/localstoragemanager";
import socket from "@/services/socket";
import * as _ from "lodash";
import { CluedoGameEvent } from "../../../src/socket/events";
import { QueryParameters } from "../../../src/routes/parameters";
import Action = QueryParameters.Action;

const loading = ref<boolean>(true);
let reactiveGame = reactive<CluedoGame>({} as CluedoGame);
let iGamer: Gamer;
let othersGamers: Gamer[];

const amISilent = computed(() => iGamer.role?.includes(Gamers.Role.SILENT) || false);

const components = defineComponent({
  unmounted() {
    console.debug('unmounted STARTED ROOM')
    Object.values(CluedoGameEvent.GameActionEvent).map(v => v.action(reactiveGame.identifier)).forEach(e => socket.off(e));
  }
})

function connectSocketLikeGamer() {
  const gamerAuth = {
    gamerId: localGameStorageManager.localGamer.identifier,
    gameId: localGameStorageManager.localGame.identifier,
    accessToken: localGameStorageManager.accessToken
  }
  console.debug('Socket auth ', socket.auth)
  console.debug('gamerAuth ',gamerAuth);
  if(!_.isEqual(socket.auth, gamerAuth)) {
    socket.connectLike(gamerAuth).on('connect', () => {
      console.debug(`Started room: connect socket ${socket.id}`);
    })
  }
}

function getStartedGame(gameId: string) {
  axios
    .get(RestAPIRouteName.GAME.replace(':id', gameId), {
      headers: {
        authorization: localGameStorageManager.accessToken,
      },
      params: {
        status: CluedoGames.Status.STARTED,
      },
    })
    .then(response => {
      console.debug('Game in started = ', response.data);
      if (
        !response.data.gamers.find(
          (g: Gamer) => localGameStorageManager.localGamer.identifier === g.identifier
        )
      ) {
        router.replace({name: 'home'});
      }
      if (response.data.status === CluedoGames.Status.STARTED) {
        router.replace({
          name: 'started-room',
          params: {id: response.data.identifier},
        });
      }
      localGameStorageManager.localGame = response.data;
      setReactiveGame(response.data);
      connectSocketLikeGamer();
    })
    .catch((err: AxiosError) => {
      if (err.response?.status === ResponseStatus.NOT_FOUND) {
        if(!localGameStorageManager.isEmpty() && localGameStorageManager.localGame.identifier === gameId) {
          localGameStorageManager.remove();
        }
        router.replace({name: 'home'});
      } else {
        console.error(err);
      }
    })
    .finally(() => (loading.value = false));
}

function setReactiveGame(game: CluedoGame) {
  reactiveGame = reactive<CluedoGame>(game);
  iGamer = reactiveGame.gamers.find(g => g.identifier === localGameStorageManager.localGamer.identifier) || ({} as Gamer)
  if(iGamer.notes) iGamer.notes.structuredNotes = iGamer.notes.structuredNotes || [];
  othersGamers = reactiveGame.gamers.filter(g => g.identifier !== localGameStorageManager.localGamer.identifier) || []
}

getStartedGame(router.currentRoute.value.params.id as string);

watch(reactiveGame, (newGame) => {
  console.debug('WATCH GAME ', newGame);
  localGameStorageManager.localGame = newGame;
  localGameStorageManager.localGamer = newGame.gamers.find(g => g.identifier === localGameStorageManager.localGamer.identifier) || {} as Gamer;
})

function onWriteNotes(note: string | StructuredNoteItem[]) {
  console.debug('onWriteNotes ', note)
  if(iGamer.notes) {
    if(typeof note === 'string') {
      iGamer.notes.text = note
      socket.emit(CluedoGameEvent.GameActionEvent.CLUEDO_TAKE_NOTES.action(reactiveGame.identifier), {
        gamer: localGameStorageManager.localGamer.identifier,
        note: iGamer.notes
      }, (response: any) => {
        console.debug('Notes updated')
      });
    } else {
      iGamer.notes.structuredNotes = note;
      axios.patch(RestAPIRouteName.GAME.replace(':id', reactiveGame.identifier), iGamer.notes, {
        headers: {
          authorization: localGameStorageManager.accessToken
        },
        params: {
          gamer: localGameStorageManager.localGamer.identifier,
          action: Action.TAKE_NOTES
        }
      }).then((res) => console.debug(res.data)).catch(err => console.error(err))
    }
  }
}
</script>

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer fluid v-if="!loading && iGamer" >
      <BRow>
        <BCol class="col-12 col-md-4 col-lg-3 my-2">
          <BContainer>
            <BRow class="my-1">
              <!-- List of Gamers -->
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>Gamers</h4>
                </template>
                <BListGroup>
                  <BListGroupItem v-for="gamer in reactiveGame.gamers" :class="gamer.role?.includes(Gamers.Role.SILENT)?'disabled': ''"
                  ><gamer-description id="list-gamer" :gamer="gamer" ></gamer-description
                  ></BListGroupItem>
                </BListGroup>
              </BCard>
            </BRow>
            <BRow class="my-1">
              <!-- List of operations and round gamer -->
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>Operations</h4>
                </template>
                <operations-game-component :game="reactiveGame"/>
              </BCard>
            </BRow>
            <BRow class="my-1">
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>History</h4>
                </template>
                <!-- List of action performed by gamers -->
                <history-storage-component :game="reactiveGame" />
              </BCard>
            </BRow>
          </BContainer>
        </BCol>
        <BCol class="col-12 col-md-8 col-lg-5 my-2">
          <game-board :game="reactiveGame" />
        </BCol>
        <BCol class="col-12 col-md-8 offset-md-4 col-lg-4 offset-lg-0 my-2" >
          <BCard no-body class="p-1 pt-0">
            <template #header>
              <h4>Notes</h4>
            </template>
            <BFormTextarea
              no-resize
              rows="14"
              class="mb-2"
              v-model="iGamer.notes.text"
              @input="onWriteNotes"
              :disabled="amISilent"
            />
            <note-structured-component
              colum-label="Room"
              :options="reactiveGame.rooms"
              :my-cards="iGamer.cards"
              :my-assumptions="iGamer.assumptions"
              :value="iGamer.notes?.structuredNotes"
              :disabled="amISilent"
              @input="onWriteNotes"
            />

            <note-structured-component
              colum-label="Weapon"
              :options="reactiveGame.weapons"
              :my-cards="iGamer.cards"
              :my-assumptions="iGamer.assumptions"
              :value="iGamer.notes?.structuredNotes"
              :disabled="amISilent"
              @input="onWriteNotes"
            />

            <note-structured-component
              colum-label="Character"
              :options="reactiveGame.characters"
              :my-cards="iGamer.cards"
              :my-assumptions="iGamer.assumptions"
              :value="iGamer.notes?.structuredNotes"
              :disabled="amISilent"
              @input="onWriteNotes"
            />
          </BCard>
        </BCol>
      </BRow>
    </BContainer>
  </BOverlay>
</template>

<style scoped>
.disabled {
  background-color: rgba(161, 159, 159, 0.33);
}
</style>
