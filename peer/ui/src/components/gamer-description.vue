<script lang="ts">
import { defineComponent, PropType } from "vue";
import { GamerElements, Gamers } from "../../../../libs/model";
import CharacterName = GamerElements.CharacterName;
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { localGameStorageManager } from "@/services/localstoragemanager";

export default defineComponent({
  props: {
    id:  {type: String, required: true},
    gamer: { type: Object as PropType<Gamer>, required: true },
    onlyIcon: {type: Boolean, required: false},
    size: {type: String, required: false, enum: ["sm", "md", "lg"]},
  },
  name: "gamer-description",
  computed: {
    avatarId() {
      return `${this.id}-avatar-${this.gamer.identifier}-${this.gamer.characterToken}`
    },
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
        if(!this.gamer.identifier && !localGameStorageManager.localGamer.identifier) throw new Error();
        return localGameStorageManager.localGamer.identifier === this.gamer.identifier ? 'Me' : false
      }  catch (e){
        return false;
      }
    },
    completeName(): string {
      return this.gamer.characterToken + (this.gamer.username ? ` (${this.gamer.username})`: '') +( this.isSilentGamer ? ' silent': '')
    },
    isSilentGamer(): boolean {
      return this.gamer.role?.includes(Gamers.Role.SILENT) || false;
    }
  }
});
</script>

<template>
  <div class="my-2" >
    <BTooltip v-if="onlyIcon" :target="avatarId" triggers="hover">
      {{completeName}}
    </BTooltip>
    <BAvatar :id="avatarId" class="align-content-center p-0" :size="size || 'md'" rounded="lg" :badge="me" badge-variant="dark" :variant="variant" icon="person-circle" :alt="gamer.characterToken">
      <font-awesome-icon :icon="isSilentGamer ? 'user-slash':'user'" :size="size || '1x'" />
    </BAvatar>
    <span class="mx-2" v-if="!onlyIcon">
      <b>{{(gamer as Gamer).characterToken?.toUpperCase()}}</b>
      <span v-if="!noUsername"> ({{(gamer as Gamer).username}})</span>
    </span>
  </div>
</template>

<style scoped>
.bg-purple {
  background-color: blueviolet;
}
</style>
