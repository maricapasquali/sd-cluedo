import {defineComponent} from 'vue';
import axios from 'axios';
import {sessionStoreManager} from '@/services/sessionstore';
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
      if (this.$router.currentRoute.value.name === routesNames.HOME) {
        this.$emit(
          'removed-gamer',
          sessionStoreManager.game.identifier,
          sessionStoreManager.gamer.identifier
        );
        sessionStoreManager.remove();
      } else {
        sessionStoreManager.remove();
        this.$router.replace({name: routesNames.HOME});
      }
    },
    removeGamer() {
      this.loading = true;
      axios
        .delete(
          RestAPIRouteName.GAMER.replace(
            ':id',
            sessionStoreManager.game.identifier
          ).replace(':gamerId', sessionStoreManager.gamer.identifier),
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
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
