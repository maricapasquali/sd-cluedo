<script lang="ts" src="./script.ts" />

<template>
  <BCard class="h-100 mb-2" :key="game.identifier" :bg-variant="game.status===CluedoGame.Status.WAITING ? 'light': 'lightgray'">
    <template #header>
      <BContainer>
        <BRow>
          <span data-label="creation-date" class="d-flex justify-content-end">
            {{createdAtString(game)}}
          </span>
        </BRow>
        <BRow>
          <h4 class="mb-0">
            <BFormText :text-variant="game.status===CluedoGame.Status.WAITING ? 'success': game.status === CluedoGame.Status.STARTED ? 'primary' : 'danger'">{{game.status.toUpperCase()}}</BFormText>
            game {{game.identifier}}
          </h4>
        </BRow>
      </BContainer>
    </template>
    <BContainer>
      <gamer-description id="list-game" v-for="gamer in game.gamers" :gamer="gamer" :key="gamer.identifier" :online="game.status === CluedoGame.Status.WAITING" />
    </BContainer>
    <BContainer v-if="game.status===CluedoGame.Status.FINISHED" class="justify-content-center">
      <p><h5>Winner is <b>{{winner}}</b></h5></p>
      <p><h5>Solution: <b>{{game.solution?.character}}</b> has killed using <b>{{game.solution?.weapon}}</b> in <b>{{game.solution?.room}}</b> </h5></p>
    </BContainer>
    <slot name="body" :game="game" />
    <template #footer v-if="game.status===CluedoGame.Status.WAITING">
      <slot name="footer" :game="game" />
    </template>
  </BCard>
</template>
