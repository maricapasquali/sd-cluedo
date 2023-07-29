<script lang="ts">
import GamerDescription from "@/components/gamer-description.vue";
import PostNewGame from "@/components/home/post-new-game.vue";
import { RestAPIRouteName } from "../../../src/routes/routesNames";
import { defineComponent } from 'vue';
import axios from "axios";
import { CluedoGames } from "../../../../libs/model";
import BtnRemoveGamer from "@/components/btn-remove-gamer.vue";
import { localGameStorageManager } from "@/services/localstoragemanager";
import { BContainer } from "bootstrap-vue-next";
import GameCard from "@/components/started-room/game-card.vue";
export default defineComponent({
  name: 'Home',
  components: {
    GameCard,
    BContainer,
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
      noInGame,
      filteredStatus: '' as '' | CluedoGames.Status,
      optionsStatus: [{ value: '', text: 'NO FILTER'}, ...Object.values(CluedoGames.Status).map(s => ({value: s, text: s.toUpperCase()}))],
    }
  },
  computed: {
    CluedoGames() {
      return CluedoGames
    },
    filteredGames(): CluedoGame[] {
      return this.filteredStatus.length > 0 ? this.games.filter((g: CluedoGame) => g.status === this.filteredStatus) : this.games;
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
    getGames() {
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
            <BButton v-if="inGame(game.identifier)" @click="$router.replace({name: game.status === CluedoGames.Status.STARTED ? 'started-room': 'waiting-room', params: {id: game.identifier}})">Go to game</BButton>
            <btn-remove-gamer v-if="inGame(game.identifier)" @removed-gamer="onRemoveGamer" />
            <post-new-game v-if="noInGame && game.status === CluedoGames.Status.WAITING" :game="game" @posted-gamer="onPostedGamer" />
          </BContainer>
        </template>
      </game-card>
    </BContainer>
    <p v-if="!loading && games.length == 0">No waiting games</p>
  </BOverlay>
</template>

<style>
.bg-lightgray {
  background-color: lightgray;
}
</style>
