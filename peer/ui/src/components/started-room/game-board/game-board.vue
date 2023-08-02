<script lang="ts" src="./script.ts"/>

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
      <room-component :rooms="first3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-component>
    </BRow>
    <BRow >
      <room-component :rooms="middle3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon /></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-component>
    </BRow>
    <BRow>
      <room-component :rooms="last3Room">
        <template #characters="{room}">
          <div v-for="gamer in allCharacters"><gamer-description id="game-board" v-if="isGamerIn(room, gamer)" :gamer="gamer" size="sm" only-icon/></div>
        </template>
        <template #weapons="{room}">
          <div v-for="weapon in game.weapons"> <weapon-description v-if="isWeaponIn(room, weapon)" :weapon="weapon"/></div>
        </template>
      </room-component>
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

<style lang="scss" scoped src="./style.scss"/>
