import {defineComponent, PropType} from 'vue';
import * as _ from 'lodash';
import {CluedoGames} from '@model';

export default defineComponent({
  props: {
    game: {
      type: Object as PropType<CluedoGame>,
      required: true,
    },
  },
  name: 'game-card',
  data() {
    return {};
  },
  computed: {
    CluedoGames() {
      return CluedoGames;
    },
    winner() {
      const winner = this.game.gamers.find(g =>
        _.isEqual(g.accusation, this.game.solution)
      );
      return (
        winner ? `${winner.characterToken} (${winner.username})` : 'None one'
      ).toUpperCase();
    },
  },
  methods: {
    createdAtString(game: CluedoGame & {createdAt: string}): string {
      if (!game.createdAt) return '';
      const date = new Date(Date.parse(game.createdAt));
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    },
  },
});
