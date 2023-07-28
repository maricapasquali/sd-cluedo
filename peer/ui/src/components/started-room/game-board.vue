<script setup lang="ts">
import RoomComponents from "@/components/started-room/room-component.vue";
import WeaponDescription from "@/components/started-room/weapon-description.vue";
import GamerDescription from "@/components/gamer-description.vue";
import LobbyComponent from "@/components/started-room/lobby-component.vue";
import * as _ from "lodash";
import { computed, PropType, reactive } from "vue";
import { GamerElements } from "../../../../../libs/model";
import LobbyName = GamerElements.LobbyName;

const props = defineProps({
  game: {
    type: Object as PropType<CluedoGame>,
    required: true
  }
})

const roomsClone = _.cloneDeep(props.game.rooms);
const first3Room = roomsClone?.slice(0, 3);
const middle3Room = roomsClone?.slice(3, 6);
const last3Room = roomsClone?.slice(6, roomsClone?.length);
const mainLobby: Lobby = props.game?.lobbies?.find((l: Lobby) => l.name === LobbyName.MAIN_LOBBY) || ({} as Lobby);
const backLobby: Lobby = props.game?.lobbies?.find((l: Lobby) => l.name === LobbyName.BACK_LOBBY) || ({} as Lobby);

function isGamerIn(place: Room | Lobby, gamer: Gamer): boolean {
  return !!props.game.characters?.find(p => p.name === gamer.characterToken && p.place === place.name)
}

function isWeaponIn(place: Room, weapon:  Weapon): boolean {
  return weapon.place === place.name
}

const noGamerCharacters = (props.game.characters?.filter(c => !props.game.gamers.map(g => g.characterToken).includes(c.name)).map(c =>(reactive({characterToken: c.name}))) || [])
const allCharacters = computed(() => [...noGamerCharacters, ...props.game.gamers]);

</script>

<template>
  <BContainer class="game-board">
    <BRow>
      <BCol></BCol>
      <lobby-component :lobby="backLobby">
        <template #characters="{lobby}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(lobby, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
      </lobby-component>
      <BCol></BCol>
    </BRow>
    <BRow>
      <room-components :rooms="first3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-components>
    </BRow>
    <BRow >
      <room-components :rooms="middle3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon /></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-components>
    </BRow>
    <BRow>
      <room-components :rooms="last3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-components>
    </BRow>
    <BRow>
      <BCol></BCol>
      <lobby-component :lobby="mainLobby">
        <template #characters="{lobby}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(lobby, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
      </lobby-component>
      <BCol></BCol>
    </BRow>
  </BContainer>
</template>

<style scoped lang="scss">
.game-board {
  background-color: green;
  border-radius: 20px;
}
</style>
