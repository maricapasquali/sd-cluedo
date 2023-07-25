<script setup lang="ts">
import axios, { AxiosError } from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { CluedoGames } from "../../../../libs/model";
import router from "@/router";
import { ref } from "vue";
import { ResponseStatus } from "../../../../libs/utils/rest-api/responses";

const localGame = JSON.parse(window.localStorage.getItem('game') || '{}');
const gameId = router.currentRoute.value.params.id as string;

const loading = ref<boolean>(false);
const game = ref<CluedoGame>();

function getStartedGame(){
  loading.value = true;
  //TODO: (Peer server) REMOVE solution and cards of other gamers in GET /api/v1/games/:id only if status == CluedoGames.Status.STARTED
  axios.get(RestAPIRouteName.GAME.replace(':id', gameId), {
    headers: {
      authorization: localGame.accessToken,
    },
    params: {
      status: CluedoGames.Status.STARTED,
    }
  })
    .then(response => {
      console.debug('Game in started = ', response.data)
      if(!response.data.gamers.find((g: Gamer) => localGame.gamer?.identifier === g.identifier)) {
        router.replace({name: 'home'});
      }
      if(response.data.status === CluedoGames.Status.STARTED) {
        router.replace({name: 'started-room', params: {id: response.data.identifier}});
      }
      localGame.game = response.data;
      window.localStorage.setItem('game', JSON.stringify(localGame));
      game.value = response.data;
    }).catch((err: AxiosError) => {
      if(err.response?.status === ResponseStatus.NOT_FOUND) {
        router.replace({name: 'home'});
      } else {
        console.error(err)
      }
  }).finally(() => loading.value = false);
}
if(!localGame?.game?.status){
  getStartedGame();
} else {
  game.value = localGame.game;
}
</script>

<template>
  {{ game }}
</template>

<style scoped>

</style>
