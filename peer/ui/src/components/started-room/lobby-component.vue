<script lang="ts">
import { defineComponent, PropType } from "vue";
import GamerDescription from "@/components/gamer-description.vue";

export default defineComponent({
  name: "lobby-component",
  props: {
    lobby:  {
      type: Object as PropType<Lobby>,
      required: true
    }
  },
  components: { GamerDescription }
});
</script>

<template>
  <BCol :id="lobby.name" class="lobby">
    <BTooltip :target="lobby.name" triggers="hover">
      {{lobby.name}}
    </BTooltip>
    <span class="position-absolute"><b>{{lobby.name?.toUpperCase()}}</b></span>
    <div>
      <slot name="characters" :lobby="lobby"></slot>
    </div>
  </BCol>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  align-items: center !important;
  justify-content: center !important;
  border: 0.5px solid;
  background-color: lightgray;
  color: black;
  width: 200px;
  height: 130px;
  position: relative;
  & > div {
    display: grid;
    grid-template-columns: auto auto auto;
    grid-gap: 3px;
  }
}
</style>
