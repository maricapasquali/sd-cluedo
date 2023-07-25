<script setup lang="ts">

import axios from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import router from "@/router";
import { ref } from "vue";

const loading = ref<boolean>(false);

const emit = defineEmits<{
  (e: 'removed-gamer', game: string, gamer: string): void
}>()

function removeGamer() {
  const localGame = JSON.parse(window.localStorage.getItem('game') || '{}');

  loading.value = true;
  axios.delete(RestAPIRouteName.GAMER.replace(':id', localGame?.game.identifier).replace(':gamerId', localGame?.gamer.identifier),
    {
      headers: {
        authorization: localGame.accessToken,
      }
    }).then(() => {
    window.localStorage.removeItem('game');
    if(router.currentRoute.value.name === 'home') {
      emit('removed-gamer', localGame?.game.identifier, localGame?.gamer.identifier)
    } else {
      router.replace({name: 'home'});
    }
  }).catch(err => console.error(err)).finally(() => loading.value = false)
}

</script>

<template>
  <BButton variant="secondary" @click="removeGamer"> Cancel </BButton>
</template>

<style scoped>

</style>
