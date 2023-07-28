<script setup lang="ts">
import SecretPassage from "@/components/started-room/secret-passage.vue";
import { PropType } from "vue";
import { GamerElements } from "../../../../../libs/model";
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
import RoomName = GamerElements.RoomName;

const props = defineProps({
  rooms: {
    type: Object as PropType<Room[]>,
    required: true
  }
})

const colorsRoom: {[key: string]: string} = {}
Object.entries(RoomWithSecretPassage).forEach(([room, secretPassage]) => {
  if((room as RoomName) === RoomName.BILLIARD_ROOM) {
    colorsRoom[room] = "lightblue";
    colorsRoom[secretPassage] = colorsRoom[room];
  } else if((room as RoomName) === RoomName.BALLROOM) {
    colorsRoom[room] = "orange";
    colorsRoom[secretPassage] = colorsRoom[room];
  }
})

const secretRoomClasses = (room: Room): any => {
  return {
    'secret-passage': true,
    'position-absolute': true,
    'bottom-0 end-0' : (room.name as RoomName) === RoomName.BALLROOM || (room.name as RoomName) === RoomWithSecretPassage[RoomName.BALLROOM],
    'bottom-0 start-0' : (room.name as RoomName) === RoomName.DINING_ROOM || (room.name as RoomName) === RoomWithSecretPassage[RoomName.DINING_ROOM]
  }
}
</script>

<template>
  <BCol :id="room.name" class="room" v-for="room in rooms" >
    <BTooltip :target="room.name" triggers="hover">
      {{room.name}}
    </BTooltip>
    <span class="position-absolute"><b> {{room.name?.toUpperCase()}}</b></span>
    <div>
      <slot name="characters" :room="room"></slot>
      <slot name="weapons" :room="room"></slot>
    </div>
    <div v-if="room.secretPassage">
      <secret-passage :id="'secret-passage-of-'+room.name" aria-label="secret-passage" :class="secretRoomClasses(room)" :bg-color="colorsRoom[room.name]" :alt="room.secretPassage" />
      <BTooltip :target="'secret-passage-of-'+room.name" triggers="hover">
        Secret Passage to {{room.secretPassage.toUpperCase()}}
      </BTooltip>
    </div>
  </BCol>
</template>

<style scoped lang="scss">
.secret-passage {
  width: 25px;
  height: 25px;
}

.room {
  display: flex;
  align-items: center !important;
  justify-content: center !important;
  border: 0.5px solid;
  background-color: brown;
  color: black;
  width: 200px;
  height: 130px;
  position: relative;
  & > div {
    display: grid;
    grid-template-columns: auto auto auto auto auto;
    grid-gap: 3px;
  }
}
</style>
