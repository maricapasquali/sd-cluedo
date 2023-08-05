<script lang="ts" src="./script.ts" />

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer v-if="!loading" class="mb-3">
      <BRow class="d-flex justify-content-between">
        <BCol class="d-flex justify-content-start">
          <post-new-game @posted-game="onPostedGame" />
        </BCol>
        <BCol v-if="games.length > 0" class="d-flex justify-content-end">
          <BFormSelect v-model="filteredStatus" :options="optionsStatus"/>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer>
      <BRow class="justify-content-start">
        <BCol v-for="game in filteredGames" class="mb-2 col-12 col-md-6 col-lg-5 col-xl-4">
          <game-card :game="game">
            <template #footer="{game}">
              <BContainer>
                <BRow v-if="game.status === CluedoGames.Status.WAITING">
                  <BCol class="d-flex justify-content-end">
                    <post-new-game :game="game" @posted-gamer="onPostedGamer" />
                  </BCol>
                </BRow>
              </BContainer>
            </template>
          </game-card>
        </BCol>
      </BRow>
    </BContainer>
    <p v-if="!loading && games.length == 0">No waiting games</p>
  </BOverlay>
</template>

<style lang="scss" src="./style.scss" />
