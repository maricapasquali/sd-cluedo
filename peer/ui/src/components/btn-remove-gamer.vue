<script setup lang="ts">

import axios from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import router from "@/router";
import { ref } from "vue";
import { localGameStorageManager } from "@/services/localstoragemanager";
import { ResponseStatus } from "../../../../libs/utils/rest-api/responses";

const loading = ref<boolean>(false);

const emit = defineEmits<{
  (e: 'removed-gamer', game: string, gamer: string): void
}>()

const _localGameId = localGameStorageManager.localGame.identifier
const _localGamerId = localGameStorageManager.localGamer.identifier

function exit() {
  localGameStorageManager.remove();
  if(router.currentRoute.value.name === 'home') {
    emit('removed-gamer', _localGameId, _localGamerId)
  } else {
    router.replace({name: 'home'});
  }
}

function removeGamer() {
  loading.value = true;
  axios.delete(RestAPIRouteName.GAMER.replace(':id', _localGameId).replace(':gamerId', _localGamerId),
    {
      headers: {
        authorization: localGameStorageManager.accessToken,
      }
    })
    .then(() => exit())
    .catch(err => {
      if(err.response.status === ResponseStatus.NOT_FOUND) exit();
      else console.error(err)
    })
    .finally(() => loading.value = false)
}

</script>

<template>
  <BButton variant="secondary" @click="removeGamer"> Cancel </BButton>
</template>

<style scoped>

</style>
