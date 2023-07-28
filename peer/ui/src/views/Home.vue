<script lang="ts">
import GamerDescription from "@/components/gamer-description.vue";
import PostNewGame from "@/components/home/post-new-game.vue";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { defineComponent } from 'vue';
import axios from "axios";
import { CluedoGames } from "../../../../libs/model";
import BtnRemoveGamer from "@/components/btn-remove-gamer.vue";
import * as _ from 'lodash';
import { localGameStorageManager } from "@/services/localstoragemanager";
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
    const noInGame: boolean =  localGameStorageManager.isEmpty();
    console.debug("noInGame ", noInGame)
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
      return localGameStorageManager.localGame.identifier === game;
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
    getWinner(game: CluedoGame): string {
      const winner = game.gamers.find(g => _.isEqual(g.accusation, game.solution))
      return (winner? `${winner.characterToken} (${winner.username})` : 'None one').toUpperCase();
    },
    getGames() {
      //TODO: (Peer server) REMOVE solution and cards of other gamers in GET /api/v1/games only if status != CluedoGames.Status.FINISHED
      axios
        .get(RestAPIRouteName.GAMES)
        .then(response => {
          console.debug(response);
          const noFinishedGames = response.data;
          const game = noFinishedGames.find((g: CluedoGame) => g.identifier === localGameStorageManager.localGame.identifier && g.gamers.find(gm => gm.identifier == localGameStorageManager.localGamer.identifier))
          console.debug('My game', game)
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
          <h4 class="mb-0">Game {{game.identifier}} {{game.status.toUpperCase()}} </h4>
        </template>
        <BContainer>
          <gamer-description id="list-game" v-for="gamer in game.gamers" :gamer="gamer" :key="gamer.identifier" />
        </BContainer>
        <BContainer v-if="game.status===CluedoGames.Status.FINISHED" class="justify-content-center">
          <p><h5>Winner is <b>{{getWinner(game)}}</b></h5></p>
          <p><h5>Solution: <b>{{game.solution?.character}}</b> has killed using <b>{{game.solution?.weapon}}</b> in <b>{{game.solution?.room}}</b> </h5></p>
        </BContainer>
        <BContainer class="d-flex justify-content-between" v-else>
          <BButton v-if="inGame(game.identifier)" @click="$router.replace({name: game.status === CluedoGames.Status.STARTED ? 'started-room': 'waiting-room', params: {id: game.identifier}})">Go to game</BButton>
          <btn-remove-gamer v-if="inGame(game.identifier)" @removed-gamer="onRemoveGamer" />
          <post-new-game v-if="noInGame && game.status === CluedoGames.Status.WAITING" :game="game" @posted-gamer="onPostedGamer" />
       </BContainer>
      </BCard>
    </BContainer>
    <p v-if="!loading && games.length == 0">No waiting games</p>
  </b-overlay>
</template>
