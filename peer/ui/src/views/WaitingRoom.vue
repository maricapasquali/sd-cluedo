<script setup lang="ts">
import { ref } from "vue";
import router from '../router'
import axios from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { CluedoGames } from "../../../../libs/model";
import BtnRemoveGamer from "@/components/btn-remove-gamer.vue";
import { QueryParameters } from "../../../src/routes/parameters";
import { localGameStorageManager } from "@/services/localstoragemanager";
import GameCard from "@/components/started-room/game-card.vue";

const gameId = router.currentRoute.value.params.id as string;
const loading = ref<boolean>(true);
const game = ref<CluedoGame>();

function getWaitingGame(){
  axios.get(RestAPIRouteName.GAME.replace(':id', gameId))
    .then(response => {
      console.debug('Game in waiting = ', response.data)
      if(!response.data.gamers.find((g: Gamer) => localGameStorageManager.localGamer.identifier === g.identifier) || response.data.status === CluedoGames.Status.FINISHED) {
        router.replace({name: 'home'});
      }
      if(response.data.status === CluedoGames.Status.STARTED) {
        router.replace({name: 'started-room', params: {id: response.data.identifier}});
      }
      game.value = response.data;
    }).catch(err => console.error(err)).finally(() => loading.value = false);
}

function startGame() {
  axios.patch(RestAPIRouteName.GAME.replace(':id', gameId), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: QueryParameters.Action.START_GAME
    }
  }).then(response => {
    console.debug(response.data);
    localGameStorageManager.localGame = response.data;
    router.replace({name: 'started-room', params: {id: gameId}})
  }).catch(err => console.error(err));
}

getWaitingGame();

</script>

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer v-if="!loading">
      <game-card v-if="game" :game="game">
        <template #footer="{game}">
          <BContainer class="mt-5 mb-4">
            <BSpinner variant="secondary" label="Looking to other gamers"/>
            <p>Looking to other gamers ({{game.gamers.length}}/{{CluedoGames.MAX_GAMERS}})</p>
          </BContainer>
          <BContainer class="mt-2 d-flex justify-content-between">
            <btn-remove-gamer @removed-gamer="router.replace({name: 'home'})"> Cancel </btn-remove-gamer>
            <BButton v-if="game.gamers.length >= CluedoGames.MIN_GAMERS" variant="success"
                     @click="startGame"> Start </BButton>
          </BContainer>
        </template>
      </game-card>
      <text v-else>No waiting game with identifier {{gameId}}</text>
    </BContainer>
  </BOverlay>
</template>

