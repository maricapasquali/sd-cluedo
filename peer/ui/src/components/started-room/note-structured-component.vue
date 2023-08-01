<script setup lang="ts">
import { PropType, reactive, watch } from "vue";
import { GamerElements } from "../../../../../libs/model";
import emitter from "@/eventbus";
import { CONFUTATION_CARD } from "@/eventbus/eventsName";

const props = defineProps({
  value: {
    type: Object as PropType<StructuredNoteItem[]>,
    required: true,
    default: []
  },
  options: {
    type: Object as PropType<{name: string}[]>,
    required: true,
    default: []
  },
  columLabel: { type: String, required: true },
  myCards: { type: Object as PropType<string[]>, required: true },
  myAssumptions: { type: Object as PropType<Assumption[]>, required: true },
  disabled: { type: Boolean, required: false}
})

const emit = defineEmits<{
  (e: 'input', structuredNotes: StructuredNoteItem[]): void
}>()

const structuredNotes = reactive<StructuredNoteItem[]>(props.value);
const suspectStates = ['', ...Object.values(GamerElements.SuspectState)];
const _notes: {[key: string]: { suspectState: string, confutation?: true }} = reactive({});

props.options?.forEach(item => {
  _notes[item.name] = {
    suspectState: isInMyHand(item) || isConfuted(item) ? GamerElements.SuspectState.EXCLUDED : '',
  };
  if(isConfuted(item)) _notes[item.name].confutation = true;
})

emitter.on(CONFUTATION_CARD, (message: {assumption: Suggestion; card: string}) => {
  const {assumption, card} = message;
  console.debug('Assumption ', assumption, ', card ', card)
  if(card.length === 0) {
    Object.values(assumption)
      .filter(c => c !== null && !isInMyHand(c) && !isConfuted(c))
      .forEach((c: string) => _notes[c] = { suspectState: GamerElements.SuspectState.MAYBE });
  } else if(props.options?.map(i => i.name).includes(card)) {
      _notes[card] = { suspectState: GamerElements.SuspectState.EXCLUDED, confutation: true }
  }
})

watch(_notes, (newVal) => {
  console.debug(`(${props.columLabel}) NOTES CHANGES `, newVal)
  Object.entries(newVal)
    .forEach(([name, item]) => {
      const fNote = structuredNotes?.find(i => i.name === name)
      if(fNote) {
        fNote.suspectState = item.suspectState;
        fNote.confutation = item.confutation;
      }
      else structuredNotes.push({name, suspectState: item.suspectState, confutation: item.confutation })
    })
  emit('input', structuredNotes);
})

watch(props.myCards, (newMyCards) => {
  newMyCards.forEach(card => _notes[card] = { suspectState: GamerElements.SuspectState.EXCLUDED })
})

watch(props.myAssumptions, (newMyAssumptions) => {
  newMyAssumptions?.map(i => i.confutation).
  forEach(c => {
    c?.filter(i => typeof i.card === 'string' && (i.card as string).length > 0).map(i => i.card).forEach(c => {
      _notes[c as string] = { suspectState: GamerElements.SuspectState.EXCLUDED, confutation: true }
    })
  })
})

function isInMyHand(item: string | { name: string }) {
  if(typeof item === 'string') return props.myCards.find(c => c === item);
  return props.myCards.find(c => c === item.name);
}

function isConfuted(item: string | { name: string }) {
  if(typeof item === 'string') return props.myAssumptions.find(c => c.confutation?.map(i => i.card).includes(item));
  return props.myAssumptions.find(c => c.confutation?.map(i => i.card).includes(item.name));
}

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
                    <p v-if="_notes[item.name]?.confutation"> (Confutated) </p>
                  </BCol>
                  <BCol class="col-xs-7 col-sm-12 col-lg-7">
                    <BFormSelect v-model="_notes[item.name].suspectState" :options="suspectStates" :disabled="disabled" stacked/>
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
