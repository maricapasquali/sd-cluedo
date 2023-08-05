<script lang="ts" src="./script.ts" />

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer v-if="!loading">
      <BRow class="d-flex justify-content-center">
        <BCol v-if="game" class="col-12 col-md-8">
          <game-card :game="game">
            <template #body="{game}">
              <BContainer class="mt-5 mb-4">
                <BSpinner variant="secondary" label="Looking to other gamers"/>
                <p>Looking to other gamers ({{game.gamers.length}}/{{maxGamers}})</p>
              </BContainer>
            </template>
            <template #footer="{game}">
              <BContainer class="mt-2 d-flex justify-content-between">
                <btn-remove-gamer @removed-gamer="onRemovedGamer"> Cancel </btn-remove-gamer>
                <BButton v-if="game.gamers.length >= minGamers" variant="success" @click="startGame"> Start </BButton>
              </BContainer>
            </template>
          </game-card>
        </BCol>
        <BCol v-else>
          <text>No waiting game with identifier {{gameId}}</text>
        </BCol>
      </BRow>
    </BContainer>
  </BOverlay>
</template>

