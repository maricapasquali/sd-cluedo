import {defineComponent, PropType} from 'vue';
import WeaponsSvg from './svg';
import {GameElements} from '@model';

export default defineComponent({
  props: {
    weapon: {
      type: Object as PropType<Weapon>,
      required: true,
    },
  },
  name: 'weapon-description',
  components: {
    ...WeaponsSvg,
  },
  computed: {
    WeaponName() {
      return GameElements.WeaponName;
    },
  },
});
