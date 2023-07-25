<script lang="ts">
import { defineComponent } from "vue";
import { GamerElements } from "../../../../libs/model";
import CharacterName = GamerElements.CharacterName;

export default defineComponent({
  props: {
    gamer: { type: Object, required: true},
  },
  name: "gamer-description",
  computed: {
    variant() {
      switch ((this.gamer as Gamer).characterToken as CharacterName) {
        case GamerElements.CharacterName.COLONEL_MUSTARD: return 'warning'
        case GamerElements.CharacterName.MISS_SCARLET: return 'danger'
        case GamerElements.CharacterName.MRS_WHITE: return 'secondary'
        case GamerElements.CharacterName.REVEREND_GREEN: return 'success'
        case GamerElements.CharacterName.MRS_PEACOCK: return 'primary'
        case GamerElements.CharacterName.PROFESSOR_PLUM: return 'purple'
      }
    },
    noUsername(): boolean {
      return typeof (this.gamer as Gamer).username === 'undefined';
    },
    me(): string | boolean {
      try {
        return JSON.parse(window.localStorage.getItem('game') || '{}').gamer.identifier === this.gamer.identifier ? 'Me' : false
      }  catch (e){
        return false;
      }
    }
  }
});
</script>

<template>
  <BContainer class="my-2" >
    <BAvatar class="align-content-center" rounded="lg" :badge="me" badge-variant="dark" :variant="variant" icon="person-circle" />
    <span class="mx-2">
      <b>{{(gamer as Gamer).characterToken.toUpperCase()}}</b>
      <span v-if="!noUsername">({{(gamer as Gamer).username}})</span>
    </span>
  </BContainer>
</template>

<style scoped>
.bg-purple {
  background-color: blueviolet;
}
</style>
