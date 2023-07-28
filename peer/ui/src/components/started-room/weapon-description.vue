<script lang="ts">
import { defineComponent, PropType } from "vue";
import { GamerElements } from "../../../../../libs/model";
import WeaponsSvg from '@/components/started-room/weapons';

export default defineComponent({
  name: "weapon-description",
  props: {
    weapon: {
      type: Object as PropType<Weapon>,
      required: true,
    }
  },
  components: {
    ...WeaponsSvg
  },
  computed: {
    WeaponName() {
      return GamerElements.WeaponName
    },
  }
});
</script>

<template>
  <BTooltip :target="weapon.name" triggers="hover">
    {{weapon.name}}
  </BTooltip>
  <BAvatar :id="weapon.name" class="align-content-center p-1" size="sm" rounded="lg" variant="light" :alt="weapon.name">
    <Dagger v-if="weapon.name === WeaponName.DAGGER"/>
    <Candlestick v-if="weapon.name === WeaponName.CANDLESTICK"/>
    <Spanner v-if="weapon.name === WeaponName.SPANNER"/>
    <Revolver v-if="weapon.name === WeaponName.REVOLVER"/>
    <LeadPipe v-if="weapon.name === WeaponName.LEAD_PIPE"/>
    <Rope v-if="weapon.name === WeaponName.ROPE"/>
  </BAvatar>
</template>

<style scoped>
svg {
  width: 25px;
  height: 25px;
}
</style>
