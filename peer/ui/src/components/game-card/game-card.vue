<script lang="ts" src="./script.ts" />

<template>
  <BCard class="h-100 mb-2" :key="game.identifier" :bg-variant="game.status===CluedoGames.Status.WAITING ? 'light': 'lightgray'">
    <template #header>
      <BContainer>
        <BRow class="d-flex justify-content-between">
          <BCol class="col-12 col-sm-10 d-flex justify-content-start">
            <h4 class="mb-0">
              <BFormText :text-variant="game.status===CluedoGames.Status.WAITING ? 'success': game.status === CluedoGames.Status.STARTED ? 'primary' : 'danger'">{{game.status.toUpperCase()}}</BFormText>
              game {{game.identifier}}
            </h4>
          </BCol>
          <BCol class="col-12 col-sm-2 mt-2 mt-sm-0 d-flex justify-content-end">{{createdAtString(game)}}</BCol>
        </BRow>
      </BContainer>
    </template>
    <BContainer>
      <gamer-description id="list-game" v-for="gamer in game.gamers" :gamer="gamer" :key="gamer.identifier" />
    </BContainer>
    <BContainer v-if="game.status===CluedoGames.Status.FINISHED" class="justify-content-center">
      <p><h5>Winner is <b>{{winner}}</b></h5></p>
      <p><h5>Solution: <b>{{game.solution?.character}}</b> has killed using <b>{{game.solution?.weapon}}</b> in <b>{{game.solution?.room}}</b> </h5></p>
    </BContainer>
    <slot name="footer" :game="game" />
  </BCard>
</template>
