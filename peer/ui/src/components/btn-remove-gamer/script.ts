import {defineComponent} from 'vue';
import axios from 'axios';
import {localStoreManager} from '@/services/localstore';
import {ResponseStatus} from '@utils/rest-api/responses';
import {RestAPIRouteName} from '@peer/routes/routesNames';
import routesNames from '@/router/routesNames';

export default defineComponent({
  name: 'btn-remove-gamer',
  emits: ['removed-gamer'],
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    exit() {
      localStoreManager.remove();
      if (this.$router.currentRoute.value.name === routesNames.HOME) {
        this.$emit(
          'removed-gamer',
          localStoreManager.game.identifier,
          localStoreManager.gamer.identifier
        );
      } else {
        this.$router.replace({name: routesNames.HOME});
      }
    },
    removeGamer() {
      this.loading = true;
      axios
        .delete(
          RestAPIRouteName.GAMER.replace(
            ':id',
            localStoreManager.game.identifier
          ).replace(':gamerId', localStoreManager.gamer.identifier),
          {
            headers: {
              authorization: localStoreManager.accessToken,
            },
          }
        )
        .then(() => this.exit())
        .catch(err => {
          if (err.response.status === ResponseStatus.NOT_FOUND) this.exit();
          else console.error(err);
        })
        .finally(() => (this.loading = false));
    },
  },
});
