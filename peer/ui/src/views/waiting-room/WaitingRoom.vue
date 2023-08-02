<script lang="ts" src="./script.ts" />

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer v-if="!loading">
      <game-card v-if="game" :game="game">
        <template #footer="{game}">
          <BContainer class="mt-5 mb-4">
            <BSpinner variant="secondary" label="Looking to other gamers"/>
            <p>Looking to other gamers ({{game.gamers.length}}/{{maxGamers}})</p>
          </BContainer>
          <BContainer class="mt-2 d-flex justify-content-between">
            <btn-remove-gamer @removed-gamer="onRemovedGamer"> Cancel </btn-remove-gamer>
            <BButton v-if="game.gamers.length >= minGamers" variant="success" @click="startGame"> Start </BButton>
          </BContainer>
        </template>
      </game-card>
      <text v-else>No waiting game with identifier {{gameId}}</text>
    </BContainer>
  </BOverlay>
</template>

