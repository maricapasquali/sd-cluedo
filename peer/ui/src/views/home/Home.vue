<script lang="ts" src="./script.ts" />

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer v-if="!loading" class="mb-3">
      <BRow class="d-flex justify-content-between">
        <BCol v-if="noInGame || games.length == 0" class="d-flex justify-content-start">
          <post-new-game @posted-game="onPostedGame" />
        </BCol>
        <BCol v-if="games.length > 0" class="d-flex justify-content-end">
          <BFormSelect v-model="filteredStatus" :options="optionsStatus"/>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer>
      <game-card v-for="game in filteredGames" :game="game">
        <template #footer="{game}">
          <BContainer class="d-flex justify-content-between">
            <BButton v-if="inGame(game.identifier)" @click="goTo(game)">Go to game</BButton>
            <btn-remove-gamer v-if="inGame(game.identifier)" @removed-gamer="onRemoveGamer" />
            <post-new-game v-if="noInGame && game.status === CluedoGames.Status.WAITING" :game="game" @posted-gamer="onPostedGamer" />
          </BContainer>
        </template>
      </game-card>
    </BContainer>
    <p v-if="!loading && games.length == 0">No waiting games</p>
  </BOverlay>
</template>

<style lang="scss" src="./style.scss" />
