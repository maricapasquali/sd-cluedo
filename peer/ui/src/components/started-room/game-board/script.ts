import {defineComponent, PropType} from 'vue';
import * as _ from 'lodash';
import {GameElements} from '@model';
import LobbyName = GameElements.LobbyName;

export default defineComponent({
  props: {
    game: {
      type: Object as PropType<CluedoGame>,
      required: true,
    },
  },
  name: 'game-board',
  data() {
    return {
      first3Room: [] as Room[],
      middle3Room: [] as Room[],
      last3Room: [] as Room[],
      mainLobby: {} as Lobby,
      backLobby: {} as Lobby,
    };
  },
  computed: {
    allCharacters() {
      const noGamerCharacters =
        this.game.characters
          ?.filter(
            c => !this.game.gamers.map(g => g.characterToken).includes(c.name)
          )
          .map(c => ({characterToken: c.name})) || [];
      const gamerCharacters = this.game.gamers || [];
      return [...noGamerCharacters, ...gamerCharacters];
    },
  },
  methods: {
    isGamerIn(place: Room | Lobby, gamer: Gamer): boolean {
      return !!this.game.characters?.find(
        p => p.name === gamer.characterToken && p.place === place.name
      );
    },
    isWeaponIn(place: Room, weapon: Weapon): boolean {
      return weapon.place === place.name;
    },
  },
  created() {
    console.debug('GAME BOARD', this.game);
    const roomsClone = _.cloneDeep(this.game.rooms) || [];
    this.first3Room = roomsClone.slice(0, 3);
    this.middle3Room = roomsClone.slice(3, 6);
    this.last3Room = roomsClone.slice(6, roomsClone?.length);
    this.mainLobby =
      this.game.lobbies?.find((l: Lobby) => l.name === LobbyName.MAIN_LOBBY) ||
      ({} as Lobby);
    this.backLobby =
      this.game.lobbies?.find((l: Lobby) => l.name === LobbyName.BACK_LOBBY) ||
      ({} as Lobby);
  },
});
