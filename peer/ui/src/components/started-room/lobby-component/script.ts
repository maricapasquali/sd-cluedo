import {defineComponent, PropType} from 'vue';

export default defineComponent({
  name: 'lobby-component',
  props: {
    lobby: {
      type: Object as PropType<Lobby>,
      required: true,
    },
  },
});
