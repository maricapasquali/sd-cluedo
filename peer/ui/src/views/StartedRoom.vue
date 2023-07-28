<script setup lang="ts">
import axios, {AxiosError} from 'axios';
import {RestAPIRouteName} from '../../../src/routes/routesNames';
import { CluedoGames, Gamers } from "../../../../libs/model";
import router from '@/router';
import { reactive, ref, watch } from "vue";
import {ResponseStatus} from '../../../../libs/utils/rest-api/responses';
import GamerDescription from '@/components/gamer-description.vue';
import GameBoard from '@/components/started-room/game-board.vue';
import OperationsGameComponent from '@/components/started-room/gamer-actions/operations-game-component.vue';
import NoteStructuredComponent from '@/components/started-room/note-structured-component.vue';
import HistoryStorageComponent from "@/components/started-room/history-storage-component.vue";
import { localGameStorageManager } from "@/services/localstoragemanager";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { BButton } from "bootstrap-vue-next";

const loading = ref<boolean>(true);
let reactiveGame = reactive<CluedoGame>({} as CluedoGame);
let iGamer: Gamer;
let othersGamers: Gamer[];

function getStartedGame(gameId: string) {
  //TODO: (Peer server) REMOVE solution and cards of other gamers in GET /api/v1/games/:id only if status == CluedoGames.Status.STARTED
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
    })
    .catch((err: AxiosError) => {
      if (err.response?.status === ResponseStatus.NOT_FOUND) {
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
  othersGamers = reactiveGame.gamers.filter(g => g.identifier !== localGameStorageManager.localGamer.identifier) || []
}

getStartedGame(router.currentRoute.value.params.id as string);

watch(reactiveGame, (newGame) => {
  console.debug('WATCH GAME ', newGame);
  localGameStorageManager.localGame = newGame;
  localGameStorageManager.localGamer = newGame.gamers.find(g => g.identifier === localGameStorageManager.localGamer.identifier) || {} as Gamer;
})

function onWriteNotes(text: string) {
  if(iGamer.notes) iGamer.notes.text = text
}
</script>

<template>
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
      <BCol class="col-12 col-md-8 offset-md-4 col-lg-4 offset-lg-0 my-2">
        <BCard no-body class="p-1 pt-0">
          <template #header>
            <h4>Notes</h4>
          </template>
          <BFormTextarea
            no-resize
            rows="14"
            class="mb-2"
            :value="iGamer.notes?.text"
            @input="onWriteNotes"
          />
          <note-structured-component
            colum-label="Room"
            :options="reactiveGame.rooms"
            :my-cards="iGamer.cards"
            :value="iGamer.notes?.structuredNotes"
          />

          <note-structured-component
            colum-label="Weapon"
            :options="reactiveGame.weapons"
            :my-cards="iGamer.cards"
            :value="iGamer.notes?.structuredNotes"
          />

          <note-structured-component
            colum-label="Character"
            :options="reactiveGame.characters"
            :my-cards="iGamer.cards"
            :value="iGamer.notes?.structuredNotes"
          />
        </BCard>
      </BCol>
    </BRow>
  </BContainer>
  <div v-if="loading" class="d-flex justify-content-center mb-3">
    <BSpinner variant="primary" label="Loading..." />
  </div>
</template>

<style scoped>
.disabled {
  background-color: rgba(161, 159, 159, 0.33);
}
</style>
