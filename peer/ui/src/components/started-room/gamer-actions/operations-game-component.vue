<script setup lang="ts">
import OperationErrorAlert from "@/components/started-room/gamer-actions/operation-error-alert.vue";
import { computed, PropType, ref, watch } from "vue";
import GamerDescription from "@/components/gamer-description.vue";
import { QueryParameters } from "../../../../../src/routes/parameters";
import { GamerElements, Gamers } from "../../../../../../libs/model";
import { RestAPIRouteName } from "../../../../../src/routes/routesNames";
import axios, { AxiosError } from "axios";
import { MessageError, ResponseStatus } from "../../../../../../libs/utils/rest-api/responses";
import Action = QueryParameters.Action;
import emitter from '@/eventbus';
import { CONFUTATION_CARD } from "@/eventbus/eventsName";
import * as _ from "lodash";
import router from "@/router";
import LobbyName = GamerElements.LobbyName;
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
import { localGameStorageManager } from "@/services/localstoragemanager";

const props = defineProps({
  game: {
    type: Object as PropType<CluedoGame>,
    required: true,
    default: {} as CluedoGame,
  }
})

function nextGamerOf(id: string): Gamer {
  let nextIndex = props.game.gamers.findIndex(g => g.identifier === id);
  do {nextIndex = (nextIndex + 1) % props.game.gamers.length;}
  while (props.game.gamers[nextIndex].role?.includes(Gamers.Role.SILENT));
  return props.game.gamers[nextIndex] || {} as Gamer;
}

const youAreInRound = computed(() => props.game.roundGamer === localGameStorageManager.localGamer.identifier)
const inRoomWithSecretPassage = computed<boolean>(() => !!RoomWithSecretPassage[props.game?.characters?.find(c => c.name === localGameStorageManager.localGamer.characterToken)?.place || ''])
const inRoundGamer = computed(() => props.game.gamers.find(g => g.identifier === props.game.roundGamer) || {} as Gamer);
const nextGamer = computed(() => nextGamerOf(props.game.roundGamer || ''));


const inLobby = computed(() => Object.values(LobbyName).includes( props.game?.characters?.find(c => c.name === localGameStorageManager.localGamer.characterToken)?.place as LobbyName) )
const myPositionInHouse = computed(() => props.game?.characters?.find(c => c.name === localGameStorageManager.localGamer.characterToken)?.place || '')

type VModelForModal = {show: boolean}

const denialOperationError = ref<VModelForModal & {action: Action | '', error: MessageError & {codeText?: string}}>({show: false, action: '', error: { message: '' }});

const characters = props.game.characters?.map(w => w.name) || []
const rooms = props.game.rooms?.map(w => w.name) || []
const weapons = props.game.weapons?.map(w => w.name) || []


function username(gamerId: string): string {
  const gamer = props.game?.gamers.find(g => g.identifier === gamerId);
  return gamer ? `${gamer.characterToken} (${gamer.username})` : '';
}

function moveCharacterTokenIn(place: string, character?: string) {
  const _character = character || localGameStorageManager.localGamer.characterToken;
  const fCharacter = props.game.characters?.find(c => c.name == _character);
  if(fCharacter) {
    fCharacter.place = place;
  }
}

function moveWeaponTokenIn(place: string, weapon: string) {
  const fWeapon = props.game.weapons?.find(c => c.name == weapon);
  if(fWeapon) fWeapon.place = place
}

function handlerError(error: AxiosError, action: Action) {
  denialOperationError.value.show = true;
  denialOperationError.value.action = action;
  denialOperationError.value.error.cause = (error.response?.data as any).cause;
  denialOperationError.value.error.codeText = error.response?.statusText;
  denialOperationError.value.error.code = error.response?.status;
  if(error.response?.status === ResponseStatus.UNAUTHORIZED || error.response?.status === ResponseStatus.FORBIDDEN) {
    denialOperationError.value.error.message = `${Action.MAKE_ASSUMPTION}: denial operation`
  } else {
    denialOperationError.value.error.message = (error.response?.data as any).message;
  }
}

function endRound(leave: boolean = false) {
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.END_ROUND
    }
  }).then(response => {
    if(typeof response.data == 'string') {
      props.game.roundGamer = response.data;
      if(leave) {
        router.replace({name: 'home'});
        localGameStorageManager.remove();
      }
      resetRollDieModal();
      resetMakeAssumptionModal();
      resetMakeAccusationModal();
      resetUseSecretPassageModal();
    } else {
      // GAME OVER WITHOUT WINNER
      endGameModal.value.show = true;
      endGameModal.value.solution = response.data;
    }
  }).catch(err => handlerError(err, Action.END_ROUND))
}

/*ROLL DIE*/
const rollDieModal = ref<VModelForModal & {message: string}>({
  show: false,
  message: ''
})
function resetRollDieModal() {
  rollDieModal.value = {
    show: false,
    message: ''
  }
}

function rollDie() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.ROLL_DIE
    }
  }).then(response => {
    rollDieModal.value.show = true;
    rollDieModal.value.message = response.data;
    if(Object.values(LobbyName).includes(response.data as LobbyName)) {
      endRound()
    }
  }).catch((err: AxiosError) => handlerError(err, Action.ROLL_DIE))
}

function afterRollDie() {
  moveCharacterTokenIn(rollDieModal.value.message);
  rollDieModal.value.show = false;
}

/*MAKE ASSUMPTION*/
const makeAssumptionModal = ref<VModelForModal & {message: boolean, confutation: {[key: string]: string}, assumption: Suggestion}>({
  show: false,
  message: false,
  confutation: {},
  assumption: {
    character: null,
    room: null,
    weapon: null
  } as unknown as Suggestion
});

function resetMakeAssumptionModal() {
  makeAssumptionModal.value = {
    show: false,
    message: false,
    confutation: {},
    assumption: {
      character: null,
      room: null,
      weapon: null
    } as unknown as Suggestion
  }
}

function onClickMakeAssumption() {
  makeAssumptionModal.value.show = true;
  makeAssumptionModal.value.assumption.room = myPositionInHouse.value;
}

function makeAssumption() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), makeAssumptionModal.value.assumption, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.MAKE_ASSUMPTION
    }
  }).then(() => {

    makeAssumptionModal.value.message = true;
    moveCharacterTokenIn(makeAssumptionModal.value.assumption.room || '', makeAssumptionModal.value.assumption.character)
    moveWeaponTokenIn(makeAssumptionModal.value.assumption.room || '', makeAssumptionModal.value.assumption.weapon || '')

  }).catch(err => handlerError(err, Action.MAKE_ASSUMPTION))
}

function clickOkOnReceiveConfutation() {
  Object.values(makeAssumptionModal.value.confutation).filter(c => c && c.length > 0)
    .forEach(c => {
      const iGamer =  props.game.gamers.find(g => localGameStorageManager.localGamer.identifier === g.identifier);
      if(iGamer) {
        const excluded = {name: c, suspectState: GamerElements.SuspectState.EXCLUDED};
        const itemCard = iGamer.notes?.structuredNotes?.find(i => i.name === excluded.name);
        if(itemCard) {
          Object.assign(itemCard, excluded)
        } else {
          iGamer.notes?.structuredNotes?.push(excluded)
        }
      }
    })

  emitter.emit(CONFUTATION_CARD, {assumption: makeAssumptionModal.value.assumption,
    card: Object.values(makeAssumptionModal.value.confutation).find(c => c && c.length > 0) || ''});

  endRound();
}

/*MAKE ACCUSATION*/
const makeAccusationModal = ref<VModelForModal & {solution: Suggestion, accusation: Suggestion, win: boolean | null}>({
  show: false,
  solution: {} as Suggestion,
  accusation: {
    character: null,
    room: null,
    weapon: null
  } as unknown as Suggestion,
  win: null,
});

function resetMakeAccusationModal() {
  makeAccusationModal.value = {
    show: false,
    solution: {} as Suggestion,
    accusation: {
      character: null,
      room: null,
      weapon: null
    } as unknown as Suggestion,
    win: null,
  }
}

function onClickMakeAccusation() {
  makeAccusationModal.value.show = true;
}

function makeAccusation() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), makeAccusationModal.value.accusation, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.MAKE_ACCUSATION
    }
  }).then(response => {
    makeAccusationModal.value.solution = response.data.solution;
    makeAccusationModal.value.win = _.isEqual(makeAccusationModal.value.accusation, makeAccusationModal.value.solution);
  }).catch(err => handlerError(err, Action.MAKE_ACCUSATION))
}

function stopGame() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.STOP_GAME
    }
  }).then(() => {
    makeAccusationModal.value.show = false;
    localGameStorageManager.remove();
    router.replace({name: 'home'});
  }).catch(err => handlerError(err, Action.STOP_GAME))
}

function leaveGame(){
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.LEAVE
    }
  }).then(response => {
    makeAccusationModal.value.show = false;
    endRound(true);
  }).catch(err => handlerError(err, Action.LEAVE))
}
function stayInGame(){
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.STAY
    }
  }).then(response => {
    const fGamer = props.game?.gamers.find(g => g.identifier === localGameStorageManager.localGamer.identifier);
    if(fGamer) {
      fGamer.role = response.data;
      localGameStorageManager.accessToken = response.headers['x-access-token'];
    }
    makeAccusationModal.value.show = false;
    endRound();
  }).catch(err => handlerError(err, Action.STAY))
}

/*USE SECRET PASSAGE*/
const useSecretPassageModal = ref<VModelForModal & {message: string}>({
  show: false,
  message: ''
})

function resetUseSecretPassageModal() {
  useSecretPassageModal.value = {
    show: false,
    message: ''
  }
}
function useSecretPassage() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), null, {
    headers: {
      authorization: localGameStorageManager.accessToken
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.USE_SECRET_PASSAGE
    }
  }).then(response => {
    useSecretPassageModal.value.show = true;
    useSecretPassageModal.value.message = response.data;
  }).catch(err => handlerError(err, Action.USE_SECRET_PASSAGE))
}

function afterUseSecretPassage() {
  moveCharacterTokenIn(useSecretPassageModal.value.message);
  useSecretPassageModal.value.show = false;
}

/*CONFUTATION GAMER*/
const confutationAssumptionModal = ref<VModelForModal & {confute: string, arrivalAssumption: SuggestionMessage}>({
  show: false,
  confute: '',
  arrivalAssumption: {suggestion: {} as Suggestion, gamer: ''}
});

function resetConfutationAssumptionModal() {
  confutationAssumptionModal.value = {
    show: false,
    confute: '',
    arrivalAssumption: {suggestion: {} as Suggestion, gamer: ''}
  }
}

const myCardOnAssumption = computed(() => props.game.gamers.find(g => g.identifier === localGameStorageManager.localGamer.identifier)?.cards?.filter(c =>
  Object.values(confutationAssumptionModal.value.arrivalAssumption.suggestion).includes(c)) || [])

const noAssumptionArrival = computed(() =>
  confutationAssumptionModal.value.arrivalAssumption.gamer.length == 0 &&
  Object.values(confutationAssumptionModal.value.arrivalAssumption.suggestion).length === 0
)

function onClickConfutation() {
  confutationAssumptionModal.value.show = true;
}
function confutationGamerAssumption() {
  denialOperationError.value.show = false;
  axios.patch(RestAPIRouteName.GAME.replace(':id', props.game.identifier), confutationAssumptionModal.value.confute, {
    headers: {
      authorization: localGameStorageManager.accessToken,
      'content-type': 'text/plain',
    },
    params: {
      gamer: localGameStorageManager.localGamer.identifier,
      action: Action.CONFUTATION_ASSUMPTION,
    },
  }).then(res => {
    console.debug('Confute ', res.data)

    confutationAssumptionModal.value.show = false;
    confutationAssumptionModal.value.confute = '';
    confutationAssumptionModal.value.arrivalAssumption = {suggestion: {} as Suggestion, gamer: ''};

  }).catch((err: AxiosError) => handlerError(err, Action.CONFUTATION_ASSUMPTION))
}

/* ONE GAMER LEFT*/

const endGameModal = ref<VModelForModal & {solution: Suggestion}>({
  show: false,
  solution: {} as Suggestion,
});
</script>

<template>
  <BModal centered v-model="rollDieModal.show" hide-footer no-close-on-esc no-close-on-backdrop hide-header-close>
    <template #title >
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{QueryParameters.Action.ROLL_DIE.replace('_', ' ').toUpperCase()}}
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />
    <BContainer>
      <BRow>
        <BCol><p>{{rollDieModal.message}}</p></BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="outline-primary" @click="afterRollDie">Ok</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal centered v-model="makeAssumptionModal.show" hide-footer>
    <template #title >
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{QueryParameters.Action.MAKE_ASSUMPTION.replace('_', ' ').toUpperCase()}}
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />
    <BContainer v-if="!makeAssumptionModal.message" >
      <BRow>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-character"> Character </label>
          <BFormSelect id="assumption-character" v-model="makeAssumptionModal.assumption.character">
            <template #first>
              <BFormSelectOption disabled :value="null">Please select a character</BFormSelectOption>
            </template>
            <BFormSelectOption v-for="character in characters" :value="character">{{character}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-weapon"> Weapon </label>
          <BFormSelect id="assumption-weapon" v-model="makeAssumptionModal.assumption.weapon">
            <template #first>
              <BFormSelectOption disabled :value="null">Please select a weapon</BFormSelectOption>
            </template>

            <BFormSelectOption v-for="weapon in weapons" :value="weapon">{{weapon}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-room"> Room </label>
          <div id="assumption-room" class="form-control">{{ myPositionInHouse }}</div>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="primary" @click="makeAssumption">Send</BButton>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer v-else>
      <div class="my-5" v-if="Object.keys(makeAssumptionModal.confutation).length==0">
        <BRow>
          <BCol class="d-flex justify-content-center">
            <BSpinner label="waiting confutation"/>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="d-flex justify-content-center">
            <label>Waiting confutation</label>
          </BCol>
        </BRow>
      </div>
      <div v-else>
        <BContainer>
          <BRow>
            <BListGroup>
              <BListGroupItem v-for="[gamerId, card] in Object.entries(makeAssumptionModal.confutation)">
                <b>{{username(gamerId)}}</b> show me <b>{{card && card.length > 0 ? card: 'none card'}}</b>
              </BListGroupItem>
            </BListGroup>
          </BRow>
          <BRow>
            <BCol class="mt-3 d-flex justify-content-end"> <BButton variant="outline-primary" @click="clickOkOnReceiveConfutation">Ok</BButton> </BCol>
          </BRow>
        </BContainer>
      </div>
    </BContainer>

  </BModal>

  <BModal centered v-model="confutationAssumptionModal.show" hide-footer>
    <template #title >
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{QueryParameters.Action.CONFUTATION_ASSUMPTION.replace('_', ' ').toUpperCase()}}
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />
    <BContainer>
      <BRow>
        <BCol class="col-12">
          <p>
            <b>{{username(confutationAssumptionModal.arrivalAssumption.gamer)}}</b> assumed that
            <b>{{confutationAssumptionModal.arrivalAssumption.suggestion.character}}</b> has killed using
            <b>{{confutationAssumptionModal.arrivalAssumption.suggestion.weapon}}</b> in <b> {{confutationAssumptionModal.arrivalAssumption.suggestion.room}}</b>
          </p>
        </BCol>
        <BCol class="col-12" v-if="myCardOnAssumption.length > 0">
          <label  for="confutation-assumption">Confute assumption</label>
          <BFormSelect  id="confutation-assumption" v-model="confutationAssumptionModal.confute">
            <template #first>
              <BFormSelectOption value="" />
            </template>
            <BFormSelectOption v-for="card in myCardOnAssumption" :value="card">{{card}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
      </BRow>
      <BRow>
        <BCol class=" mt-3 d-flex justify-content-end">
          <BButton variant="primary" @click="confutationGamerAssumption">{{myCardOnAssumption.length>0 && confutationAssumptionModal.confute.length > 0 ? 'Show': 'No Card'}}</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal centered v-model="makeAccusationModal.show" hide-footer
          :no-close-on-esc="makeAccusationModal.win !=null"
          :no-close-on-backdrop="makeAccusationModal.win !=null"
          :hide-header-close="makeAccusationModal.win !=null"
  >
    <template #title >
      <h4 :class="'m-0 p-2 rounded-3 text-white ' + (makeAccusationModal.win == null ? 'bg-primary': makeAccusationModal.win ? 'bg-success': 'bg-danger')">
        {{QueryParameters.Action.MAKE_ACCUSATION.replace('_', ' ').toUpperCase()}}
        {{makeAccusationModal.win == null ? '': makeAccusationModal.win == true ? ': WIN': ': LOSE' }}
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />

    <BContainer v-if="Object.values(makeAccusationModal.solution).length === 0">
      <BRow>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-character"> Character </label>
          <BFormSelect id="assumption-character" v-model="makeAccusationModal.accusation.character">
            <template #first>
              <BFormSelectOption disabled :value="null">Please select a character</BFormSelectOption>
            </template>
            <BFormSelectOption v-for="character in characters" :value="character">{{character}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-weapon"> Weapon </label>
          <BFormSelect id="assumption-weapon" v-model="makeAccusationModal.accusation.weapon">
            <template #first>
              <BFormSelectOption disabled :value="null">Please select a weapon</BFormSelectOption>
            </template>

            <BFormSelectOption v-for="weapon in weapons" :value="weapon">{{weapon}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-room"> Room </label>
          <BFormSelect id="assumption-room" v-model="makeAccusationModal.accusation.room">
            <template #first>
              <BFormSelectOption disabled :value="null">Please select a room</BFormSelectOption>
            </template>

            <BFormSelectOption v-for="room in rooms" :value="room">{{room}}</BFormSelectOption>
          </BFormSelect>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="primary" @click="makeAccusation">Send</BButton>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer v-else-if="makeAccusationModal.win">
      <BRow>
        <p>I assumed that
          <b>{{makeAccusationModal.accusation.character}}</b> has killed using
          <b>{{makeAccusationModal.accusation.weapon}}</b> in <b> {{makeAccusationModal.accusation.room}}</b>
        </p>
      </BRow>
      <BRow>
        <BCol class=" mt-3 d-flex justify-content-end">
          <BButton variant="primary" @click="stopGame">Ok</BButton>
        </BCol>
      </BRow>
      <BRow></BRow>
    </BContainer>
    <BContainer v-else>
      <BRow>
        <p>I assumed that
          <b>{{makeAccusationModal.accusation.character}}</b> has killed using
          <b>{{makeAccusationModal.accusation.weapon}}</b> in <b> {{makeAccusationModal.accusation.room}}</b>
        </p>
        <div>
          Solution:
          <ul>
            <li>Character: <b>{{makeAccusationModal.solution.character}}</b></li>
            <li>Weapon: <b>{{makeAccusationModal.solution.weapon}}</b></li>
            <li>Room: <b>{{makeAccusationModal.solution.room}}</b></li>
          </ul>
        </div>
      </BRow>
      <BRow>
        <BCol class=" mt-3 d-flex justify-content-between">
          <BButton variant="primary" @click="leaveGame">Leave</BButton>
          <BButton variant="outline-primary" @click="stayInGame">Stay</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal centered v-model="useSecretPassageModal.show" hide-footer no-close-on-esc no-close-on-backdrop hide-header-close>
    <template #title >
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{QueryParameters.Action.USE_SECRET_PASSAGE.replace('_', ' ').toUpperCase()}}
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />
    <BContainer>
      <BRow>
        <BCol><p>{{useSecretPassageModal.message}}</p></BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="outline-primary" @click="afterUseSecretPassage">Ok</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal centered v-model="endGameModal.show" hide-footer no-close-on-backdrop no-close-on-esc hide-header-close>
    <template #title >
      <h4 class="m-0 p-2 bg-warning rounded-3 text-white">
        End Game
      </h4>
    </template>
    <OperationErrorAlert v-model="denialOperationError.show" :opMessageError="denialOperationError" />
    <BContainer>
      <BRow>
        <BCol class="col-12"><p>Nobody solved the murder.</p></BCol>
        <BCol class="col-12">
          Solution:
          <ul>
            <li>Character: <b>{{endGameModal.solution.character}}</b></li>
            <li>Weapon: <b>{{endGameModal.solution.weapon}}</b></li>
            <li>Room: <b>{{endGameModal.solution.room}}</b></li>
          </ul>
        </BCol>
      </BRow>
      <BRow>
        <BCol >
          <BCol class=" mt-3 d-flex justify-content-end">
            <BButton variant="outline-primary" @click="stopGame">Ok</BButton>
          </BCol>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BButtonGroup v-if="youAreInRound" vertical>
    <BButton variant="outline-primary" class="btn-action" @click="rollDie" v-if="!makeAssumptionModal.message">Roll die</BButton>
    <BButton variant="outline-primary" class="btn-action" @click="onClickMakeAssumption" v-if="!inLobby">Make assumption</BButton>
    <BButton variant="outline-primary" class="btn-action" @click="onClickMakeAccusation" v-if="!inLobby && !makeAssumptionModal.message">Make accusation</BButton>
    <BButton variant="outline-primary" class="btn-action" @click="useSecretPassage" v-if="inRoomWithSecretPassage && !makeAssumptionModal.message">Use secret passage</BButton>
  </BButtonGroup>
  <BContainer v-else class="my-3">
    <BRow>
      <BCol class="col-12"><h5>Round of</h5></BCol>
      <BCol class="col-12"><gamer-description id="gamer-in-round" :gamer="inRoundGamer"></gamer-description></BCol>
    </BRow>
    <BRow class="my-3">
      <BCol class="col-12"><h5>Next one</h5></BCol>
      <BCol class="col-12"><gamer-description id="next-gamer" :gamer="nextGamer"></gamer-description></BCol>
    </BRow>
    <BButton v-if="!noAssumptionArrival" variant="outline-primary" @click="onClickConfutation">Confutation a gamer assumption</BButton>
  </BContainer>
</template>

<style scoped>

</style>
