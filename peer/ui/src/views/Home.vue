<script lang="ts">
import GamerDescription from "@/components/gamer-description.vue";
import PostNewGame from "@/components/post-new-game.vue";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { defineComponent } from 'vue';
import axios from "axios";
import { CluedoGames } from "../../../../libs/model";
import BtnRemoveGamer from "@/components/btn-remove-gamer.vue";
import * as _ from 'lodash';
export default defineComponent({
  name: 'Home',
  computed: {
    CluedoGames() {
      return CluedoGames
    }
  },
  components: {
    BtnRemoveGamer,
    PostNewGame,
    GamerDescription
  },
  data() {
    const games: CluedoGame[] = []
    const noInGame: boolean = window.localStorage.getItem('game') == null;
    console.log("noInGame ", noInGame)
    return {
      games,
      loading: true,
      noInGame
    }
  },
  methods: {
    onPostedGame(game: CluedoGame) {
      this.games.push(game);
      this.$router.replace({name: 'waiting-room', params: {id: game.identifier}})
    },
    onPostedGamer(game: string, gamer: Gamer) {
      const fGame: CluedoGame | undefined = this.games.find((g: CluedoGame) => g.identifier === game);
      if(fGame) {
        fGame.gamers.push(gamer);
        this.$router.replace({name: 'waiting-room', params: {id: fGame.identifier}})
      }
    },
    onRemoveGamer(game: string, gamer: string) {
      const _game = this.games.find((g: CluedoGame) => g.identifier === game);
      if(_game) {
        const fGameIndex: number = _game.gamers.findIndex(gm => gm.identifier === gamer);
        if(fGameIndex > -1) {
          _game.gamers.splice(fGameIndex, 1);
          this.noInGame = true;
        }
      }

    },
    inGame(game: string): boolean {
      return JSON.parse(window.localStorage.getItem('game') || '{}').game?.identifier === game;
    },
    isInWaiting(game: CluedoGame): boolean {
      return game.status === CluedoGames.Status.WAITING
    },
    isStarted(game: CluedoGame): boolean {
      return game.status === CluedoGames.Status.STARTED
    },
    isFinished(game: CluedoGame): boolean {
      return game.status === CluedoGames.Status.FINISHED
    },
    getWinner(game: CluedoGame): Gamer | undefined {
      return game.gamers.find(g => _.isEqual(g.accusation, game.solution))
    },
    getGames() {
      axios
        .get(RestAPIRouteName.GAMES)
        .then(response => {
          console.debug(response);
          const localGame = JSON.parse(window.localStorage.getItem('game') || '{}');
          console.log('localGame ', localGame)
          const noFinishedGames = response.data.filter((game: CluedoGame) => game.status !== CluedoGames.Status.FINISHED);
          const game = noFinishedGames.find((g: CluedoGame) => g.identifier === localGame.game?.identifier && g.gamers.find(gm => gm.identifier == localGame.gamer?.identifier))
          console.log('My game', game)
          this.games = game ? [game, ...noFinishedGames.filter((g: CluedoGame) => g.identifier !== game.identifier)] : noFinishedGames;
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => this.loading = false)
    }
  },
  mounted() {
    this.getGames();
    console.log(  this.$router)
  }
});
</script>

<template>
  <b-overlay :show="loading" rounded="md">
    <BContainer v-if="noInGame" class="d-flex justify-content-start mb-3">
      <post-new-game @posted-game="onPostedGame" />
    </BContainer>
    <BContainer>
      <BCard class="h-100 mb-2" v-for="(game) in games" :key="game.identifier">
        <template #header>
          <h4 class="mb-0">Game {{game.identifier}} {{isStarted(game) ? 'STARTED' : 'IN WAITING'}} </h4>
        </template>
        <BContainer>
          <gamer-description v-for="gamer in game.gamers" :gamer="gamer" :key="gamer.identifier" />
        </BContainer>
        <BContainer class="d-flex justify-content-between">
           <BButton v-if="inGame(game.identifier)" @click="$router.replace({name: game.status === CluedoGames.Status.STARTED ? 'started-room': 'waiting-room', params: {id: game.identifier}})">Go to game</BButton>
          <btn-remove-gamer v-if="inGame(game.identifier)" @removed-gamer="onRemoveGamer" />
          <post-new-game v-if="noInGame" :game="game" @posted-gamer="onPostedGamer" />
       </BContainer>
      </BCard>
    </BContainer>
    <p v-if="!loading && games.length == 0">No waiting games</p>
  </b-overlay>
</template>
