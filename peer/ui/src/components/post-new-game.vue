<script setup lang="ts">
import { ref, PropType, defineComponent } from "vue";
import GamerDescription from "@/components/gamer-description.vue";
import { v4 as uuid } from "uuid";
import { GamerElements } from "../../../../libs/model";
import axios, { AxiosError } from "axios";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import router from "@/router";

const emit = defineEmits<{
  (e: 'posted-game', game: CluedoGame): void
  (e: 'posted-gamer', game: string, gamer: Gamer): void
}>()

const components = defineComponent({
  components: {
    GamerDescription
  }
})

const props = defineProps({
  game: Object as PropType<CluedoGame>
})

const modal = ref<boolean>(false)
const alert = ref<boolean>(false)
const loading = ref<boolean>(false)
const gamer = ref<Partial<Gamer>>({identifier: uuid()})
const error = ref<Partial<AxiosError>>({})

const cluedoCharacters = props.game ? Object.values(GamerElements.CharacterName)
    .filter(c => !props.game?.gamers.map(g => g.characterToken).includes(c))
  : GamerElements.CharacterName

function setLocalGame(localGame: {game: { identifier: string }, gamer:Gamer, accessToken: string}) {
  const localGameString = window.localStorage.getItem('game');
  if(!localGameString) {
    window.localStorage.setItem('game', JSON.stringify(localGame))
  } else {
    const _localGame = JSON.parse(localGameString);
    if(localGame.game.identifier === _localGame.game.identifier) {
      Object.assign(_localGame, localGame);
      window.localStorage.setItem('game', JSON.stringify(_localGame))
    } else {
      window.localStorage.setItem('game', JSON.stringify(localGame))
    }
    console.debug(window.localStorage.getItem('game'))
  }
}
function postGame() {
  console.debug(gamer.value.username)
  loading.value = true
  alert.value = false
  axios.post(RestAPIRouteName.GAMES, gamer.value)
    .then(response => {
      console.debug(response.data);
      modal.value = false
      emit('posted-game', response.data);
      setLocalGame({ game: {identifier: response.data.identifier}, gamer: gamer.value as Gamer, accessToken: response.headers['x-access-token'] });
    })
    .catch(err => {
      console.error(err.response);
      error.value = err
      alert.value = true
    }).finally(() => loading.value=false)
}
function enterInGame() {
  const gameId = props.game?.identifier || '';
  axios.post(RestAPIRouteName.GAMERS.replace(':id', gameId), gamer.value)
    .then(response => {
      console.debug(response.data);
      modal.value = false;
      emit('posted-gamer', gameId, response.data);
      setLocalGame({ game: {identifier: gameId}, gamer: response.data, accessToken: response.headers['x-access-token'] });
    })
    .catch(err => {
      console.error(err.response);
      error.value = err;
      alert.value = true;
    }).finally(() => loading.value=false)
}

function clickEnterInGame() {
  const gameId = props.game?.identifier || '';
  const localGame = JSON.parse(window.localStorage.getItem('game') || '{}');
  if(localGame.game?.identifier === gameId) {
    router.replace({name: 'waiting-room', params: {id: gameId}})
  } else {
    modal.value = !modal.value
  }
}

</script>

<template>
  <BButton v-if="props.game" variant="primary" @click="clickEnterInGame">Enter in game</BButton>
  <BButton v-else @click="modal = !modal" variant="success">Create new game</BButton>
  <BModal v-model="modal" hide-footer :title="props.game ? 'Enter in game '+(props.game.identifier) :'Create new game'">
    <b-overlay :show="loading" rounded="md">
      <BForm>
        <BAlert ref="error-alert" v-model="alert" variant="danger" title="Error" dismissible>
          <p><b>{{error.response?.status}} - {{error.response?.statusText}}</b></p>
          <p><b>Message</b> {{error.response?.data?.message}} </p>
          <p v-if="error.response?.data?.cause"><b>Cause</b> <br/>{{error.response?.data?.cause}}</p>
        </BAlert>
        <BFormGroup label="Username" label-for="gamer-username" >
          <BFormInput id="gamer-username" v-model="gamer.username" placeholder="Enter username"></BFormInput>
        </BFormGroup>
        <div class="my-2">
          <label variant="primary">Choose character token</label>
        </div>
        <BFormRadioGroup id="radio-character-token" v-model="gamer.characterToken" name="radio-sub-component">
          <BFormRadio v-for="character in cluedoCharacters" :value="character" style="cursor: pointer">
            <gamer-description :gamer="{characterToken: character}" style="cursor: pointer" />
          </BFormRadio>
        </BFormRadioGroup>
      </BForm>
      <BContainer class="d-flex justify-content-end">
        <b-button v-if="props.game" variant="primary" @click="enterInGame">Enter</b-button>
        <b-button v-else variant="success" @click="postGame">Create</b-button>
      </BContainer>
    </b-overlay>
  </BModal >
</template>

