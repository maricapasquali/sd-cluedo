import emitter from '@/eventbus';
import {CONFUTATION_CARD} from '@/eventbus/eventsName';
import {defineComponent, PropType} from 'vue';
import {GamerElements} from '@model';
import RoomName = GamerElements.RoomName;
import WeaponName = GamerElements.WeaponName;
import CharacterName = GamerElements.CharacterName;

export default defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<StructuredNoteItem[]>,
      required: true,
      default: [],
    },
    options: {
      type: Object as PropType<(Room & Character & Weapon)[]>,
      required: true,
      default: [],
    },
    myCards: {type: Object as PropType<string[]>, required: true, default: []},
    myAssumptions: {
      type: Object as PropType<Assumption[]>,
      required: true,
      default: [],
    },
    disabled: {type: Boolean, required: false},
  },
  emits: ['input'],
  name: 'structured-notes-component',
  data() {
    return {
      suspectStates: ['', ...Object.values(GamerElements.SuspectState)],
    };
  },
  watch: {
    myCards(newMyCards: string[]) {
      newMyCards.forEach(card => {
        const note = this.modelValue.find(i => i.name === card);
        if (note) {
          note.suspectState = GamerElements.SuspectState.EXCLUDED;
        } else {
          this.modelValue.push({
            name: card,
            suspectState: GamerElements.SuspectState.EXCLUDED,
          });
        }
      });
      this.$emit('input', this.modelValue);
    },
    myAssumptions: {
      deep: true,
      handler: function (newMyAssumptions: Assumption[]) {
        console.debug('myAssumptions ', newMyAssumptions);
        newMyAssumptions
          ?.map(i => i.confutation)
          .forEach(c => {
            c?.filter(
              i => typeof i.card === 'string' && (i.card as string).length > 0
            )
              .map(i => i.card)
              .forEach(c => {
                const note = this.modelValue.find(i => i.name === c);
                if (note) {
                  note.suspectState = GamerElements.SuspectState.EXCLUDED;
                  note.confutation = true;
                } else {
                  this.modelValue.push({
                    name: c as string,
                    suspectState: GamerElements.SuspectState.EXCLUDED,
                    confutation: true,
                  });
                }
              });
          });

        this.$emit('input', this.modelValue);
      },
    },
  },
  computed: {
    roomsNotes(): StructuredNoteItem[] {
      return this.modelValue.filter(({name}) =>
        Object.values(RoomName).includes(name as RoomName)
      );
    },
    weaponsNotes(): StructuredNoteItem[] {
      return this.modelValue.filter(({name}) =>
        Object.values(WeaponName).includes(name as WeaponName)
      );
    },
    charactersNotes(): StructuredNoteItem[] {
      return this.modelValue.filter(({name}) =>
        Object.values(CharacterName).includes(name as CharacterName)
      );
    },
  },
  methods: {
    onSelectedSuspectedState(item: StructuredNoteItem, suspectState: string) {
      console.debug('item ', item, ', selected suspectState ', suspectState);
      item.suspectState = suspectState;
      this.$emit('input', this.modelValue);
    },
    isInMyHand(item: string | {name: string}) {
      if (typeof item === 'string') return this.myCards.find(c => c === item);
      return this.myCards.find(c => c === item.name);
    },

    isConfuted(item: string | {name: string}) {
      if (typeof item === 'string')
        return this.myAssumptions.find(c =>
          c.confutation?.map(i => i.card).includes(item)
        );
      return this.myAssumptions.find(c =>
        c.confutation?.map(i => i.card).includes(item.name)
      );
    },
    onConfutationCard() {
      emitter.on(
        CONFUTATION_CARD,
        (message: {assumption: Suggestion; card: string}) => {
          const {assumption, card} = message;
          console.debug('Assumption ', assumption, ', card ', card);
          if (card.length === 0) {
            Object.values(assumption)
              .filter(
                c => c !== null && !this.isInMyHand(c) && !this.isConfuted(c)
              )
              .forEach((c: string) => {
                const note = this.modelValue.find(i => i.name === c);
                if (note) {
                  note.suspectState = GamerElements.SuspectState.MAYBE;
                } else {
                  this.modelValue.push({
                    name: c,
                    suspectState: GamerElements.SuspectState.MAYBE,
                  });
                }
              });
          } else if (this.options?.map(i => i.name).includes(card)) {
            const note = this.modelValue.find(i => i.name === card);
            if (note) {
              note.suspectState = GamerElements.SuspectState.EXCLUDED;
              note.confutation = true;
            } else {
              this.modelValue.push({
                name: card,
                suspectState: GamerElements.SuspectState.EXCLUDED,
                confutation: true,
              });
            }
          }
          this.$emit('input', this.modelValue);
        }
      );
    },
  },
  created() {
    this.onConfutationCard();
    const _init = this.options.filter(
      i => !this.modelValue.map(i => i.name).includes(i.name)
    );
    if (_init.length > 0) {
      console.debug('INIT NOTES');
      _init.forEach(item => {
        const _note: StructuredNoteItem = {
          name: item.name,
          suspectState:
            this.isInMyHand(item) || this.isConfuted(item)
              ? GamerElements.SuspectState.EXCLUDED
              : '',
        };
        if (this.isConfuted(item)) _note.confutation = true;
        this.modelValue.push(_note);
      });
      this.$emit('input', this.modelValue);
    }
  },
});
