<script setup lang="ts">
import { PropType, reactive } from "vue";
import { GamerElements } from "../../../../../libs/model";
import emitter from "@/eventbus";
import { CONFUTATION_CARD } from "@/eventbus/eventsName";

const props = defineProps({
  value: {
    type: Object as PropType<StructuredNoteItem[]>,
    required: true
  },
  options: {
    type: Object as PropType<{name: string}[]>,
    required: true
  },
  columLabel: { type: String, required: true },
  myCards: { type: Object as PropType<string[]>, required: true },
  disabled: { type: Boolean, required: false}
})

const structuredNotes = reactive(props.value);
const suspectStates = ['', ...Object.values(GamerElements.SuspectState)];
const _notes: {[key: string]: { suspectState: string, confutation?: true }} = reactive({});

emitter.on(CONFUTATION_CARD, (message: any) => {
  const {assumption, card} = message;
  if(card.length === 0) {
    Object.values(assumption).forEach((c: any) => _notes[c] = { suspectState: GamerElements.SuspectState.MAYBE });
  } else {
    _notes[card] = { suspectState: GamerElements.SuspectState.EXCLUDED, confutation: true }
  }
})

function onSelectSuspectState(suspectState: string, item: any){
  const fSNi = structuredNotes?.find(n => n.name === item.name);
   if(fSNi) {
    Object.assign(fSNi, {suspectState})
  } else {
    structuredNotes.push({name: item.name, suspectState})
  }
}

function isInMyHand(item: any) {
  return props.myCards.find(c => c === item.name);
}

function setExcluded(itemName: string, alsoStructuredNotes = false) {
  _notes[itemName] = { suspectState: GamerElements.SuspectState.EXCLUDED };
  if(alsoStructuredNotes) structuredNotes.push({name: itemName, suspectState: _notes[itemName].suspectState})
}

props.options?.forEach(item => {
  if(isInMyHand(item) && !structuredNotes?.find(n => n.name === item.name)) {
    setExcluded(item.name, true);
  } else {
    _notes[item.name] = {suspectState: ''}
  }
})
</script>

<template>
  <div class="accordion" role="tablist">
    <BCard no-body class="mb-1">
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-button v-b-toggle="'notes'+columLabel" variant="primary" class="w-100">{{ columLabel }}</b-button>
      </b-card-header>
      <BCollapse :id="'notes'+columLabel" visible accordion="my-accordion" role="tabpanel">
        <BCardBody>
          <BListGroup>
            <BListGroupItem v-for="item in options" :class="{disabled: isInMyHand(item) || _notes[item.name]?.confutation}">
              <BContainer>
                <BRow>
                  <BCol class="col-xs-5 col-sm-12 col-lg-5"><p><b>{{item.name}}</b></p>
                    <p v-if="isInMyHand(item)"> (In my hand) </p>
                    <p v-if="_notes[item.name].confutation"> (Confutated) </p>
                  </BCol>
                  <BCol class="col-xs-7 col-sm-12 col-lg-7">
                    <BFormSelect v-model="_notes[item.name].suspectState"
                                 @input="onSelectSuspectState($event, item)"
                                 :options="suspectStates" :disabled="disabled" stacked/>
                  </BCol>
                </BRow>
              </BContainer>
            </BListGroupItem>
          </BListGroup>
        </BCardBody>
      </BCollapse>
    </BCard>
  </div>
</template>

<style scoped>
.disabled {
  background-color: rgba(161, 159, 159, 0.33);
}
</style>
