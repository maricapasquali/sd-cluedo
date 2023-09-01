import {defineComponent, PropType} from 'vue';
import {sessionStoreManager} from '@/services/sessionstore';
import {GameElements, Gamer} from '@model';
import CharacterName = GameElements.CharacterName;
export default defineComponent({
  props: {
    id: {type: String, required: true},
    gamer: {type: Object as PropType<Gamer>, required: true},
    online: {
      type: Boolean,
      required: false,
      default: function (props: any): boolean {
        return (
          sessionStoreManager.gamer.identifier ===
          (props as any).gamer.identifier
        );
      },
    },
    onlyIcon: {type: Boolean, required: false},
    size: {type: String, required: false, enum: ['sm', 'md', 'lg']},
  } as any,
  name: 'gamer-description',
  computed: {
    avatarId() {
      return `${this.id}-avatar-${this.gamer.identifier}-${this.gamer.characterToken}`;
    },
    variant() {
      switch ((this.gamer as Gamer).characterToken as CharacterName) {
        case GameElements.CharacterName.COLONEL_MUSTARD:
          return 'warning';
        case GameElements.CharacterName.MISS_SCARLET:
          return 'danger';
        case GameElements.CharacterName.MRS_WHITE:
          return 'secondary';
        case GameElements.CharacterName.REVEREND_GREEN:
          return 'dark-success';
        case GameElements.CharacterName.MRS_PEACOCK:
          return 'primary';
        case GameElements.CharacterName.PROFESSOR_PLUM:
          return 'purple';
      }
    },
    noUsername(): boolean {
      return typeof (this.gamer as Gamer).username === 'undefined';
    },
    me(): string | boolean {
      try {
        if (!this.gamer.identifier && !sessionStoreManager.gamer.identifier)
          throw new Error();
        return sessionStoreManager.gamer.identifier === this.gamer.identifier
          ? 'Me'
          : this.online;
      } catch (e) {
        return false;
      }
    },
    completeName(): string {
      return (
        this.gamer.characterToken +
        (this.gamer.username ? ` (${this.gamer.username})` : '') +
        (this.isSilentGamer ? ' silent' : '')
      );
    },
    isSilentGamer(): boolean {
      return this.gamer.role?.includes(Gamer.Role.SILENT) || false;
    },
  },
});
