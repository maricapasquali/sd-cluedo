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
import socket from "@/services/socket";
import { CluedoGameEvent } from "../../../src/socket/events";

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
    return {
      games: [] as CluedoGame[],
      loading: true,
      noInGame: localGameStorageManager.isEmpty(),
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
  watch: {
    noInGame(v) {
      if(v) {
        console.debug('Remove game in localStorage')
        localGameStorageManager.remove();
      }
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
    goTo(game: CluedoGame) {
      this.$router.replace({name: game.status === CluedoGames.Status.STARTED ? 'started-room': 'waiting-room', params: {id: game.identifier}})
    },
    getGames() {
      axios
        .get(RestAPIRouteName.GAMES)
        .then(response => {
          console.debug(response);
          if(!localGameStorageManager.isEmpty()) {
            const game = response.data.find((g: CluedoGame) => g.identifier === localGameStorageManager.localGame.identifier
              && g.gamers.find(gm => gm.identifier == localGameStorageManager.localGamer.identifier))
            console.debug('My game', game)
            if(game) this.goTo(game)
            else this.noInGame = true;
          }
          this.games = response.data ;
          (this.games as (CluedoGame & { createdAt: string })[]).sort((g1,g2) => Date.parse(g2.createdAt) - Date.parse(g1.createdAt));
          this.games.forEach(g => this.handlerSocketSingleGame(g.identifier))
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => this.loading = false)
    },
    handlerSocketSingleGame(gameId: string): void {
      const game = this.games.find(g => g.identifier === gameId) || ({} as CluedoGame);
      const handler = (message: CluedoGameMessage) => {
        Object.assign(game, message);
      };
      socket.on(CluedoGameEvent.GameActionEvent.CLUEDO_START.action(gameId), handler)
      socket.on(CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(gameId), handler)
    },
  },
  mounted() {
    socket.connectLike().on('connect', () => {
      console.debug('Connect socket with id ' + socket.id)
    }).on(CluedoGameEvent.CLUEDO_NEW_GAME, (game: CluedoGame) => {
      this.games.unshift(game);
      this.handlerSocketSingleGame(game.identifier);
      console.debug('ADD NEW WAITING GAME ', game)
    }).on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) => {
      this.games.find(g => g.identifier === message.game)?.gamers.push(message.gamer);
      console.debug(`ADD NEW GAMER ${message.gamer} IN GAME %s `, message.game);
    }).on(CluedoGameEvent.CLUEDO_REMOVE_GAMER, (message: ExitGamerMessage) => {
      const game = this.games.find(g => g.identifier === message.game);
      if(game) {
        const index = game?.gamers.findIndex(gm => gm.identifier == message.gamer) || -1;
        if(index > -1) {
          game.gamers.splice(index, 1);
          console.debug(`REMOVE GAMER ${message.gamer} IN GAME %s `, message.game)
        }
      }
    });
    this.getGames();
  },
  unmounted() {
    console.debug('UNMOUNTED ', this.games)
    socket.off(CluedoGameEvent.CLUEDO_NEW_GAME);
    socket.off(CluedoGameEvent.CLUEDO_NEW_GAMER);
    socket.off(CluedoGameEvent.CLUEDO_REMOVE_GAMER);
    this.games.forEach(g => {
      socket.off(CluedoGameEvent.GameActionEvent.CLUEDO_START.action(g.identifier))
      socket.off(CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(g.identifier))
    })
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

<style>
.bg-lightgray {
  background-color: lightgray;
}
</style>
