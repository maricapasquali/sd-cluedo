import {defineComponent, PropType} from 'vue';
import {GameElements} from '@model';
import RoomWithSecretPassage = GameElements.RoomWithSecretPassage;
import RoomName = GameElements.RoomName;
import RoomComponentsSvg from './svg';
export default defineComponent({
  props: {
    rooms: {
      type: Object as PropType<Room[]>,
      required: true,
    },
  },
  name: 'room-component',
  components: {
    ...RoomComponentsSvg,
  },
  data() {
    return {
      colorsRoom: {} as {[key: string]: string},
    };
  },
  methods: {
    secretRoomClasses(room: Room): any {
      return {
        'secret-passage': true,
        'position-absolute': true,
        'bottom-0 end-0':
          (room.name as RoomName) === RoomName.BALLROOM ||
          (room.name as RoomName) === RoomWithSecretPassage[RoomName.BALLROOM],
        'bottom-0 start-0':
          (room.name as RoomName) === RoomName.DINING_ROOM ||
          (room.name as RoomName) ===
            RoomWithSecretPassage[RoomName.DINING_ROOM],
      };
    },
  },
  created() {
    Object.entries(RoomWithSecretPassage).forEach(([room, secretPassage]) => {
      if ((room as RoomName) === RoomName.BILLIARD_ROOM) {
        this.colorsRoom[room] = 'lightblue';
        this.colorsRoom[secretPassage] = this.colorsRoom[room];
      } else if ((room as RoomName) === RoomName.BALLROOM) {
        this.colorsRoom[room] = 'orange';
        this.colorsRoom[secretPassage] = this.colorsRoom[room];
      }
    });
  },
});
