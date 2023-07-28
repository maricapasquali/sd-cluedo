import {createApp} from 'vue';
import App from './src/App.vue';
import router from './src/router';
import BootstrapVueNext from 'bootstrap-vue-next';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import {Router} from 'vue-router';
import emitter from './src/eventbus';

import {library} from '@fortawesome/fontawesome-svg-core';
import {faUser, faUserSlash} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';

library.add(faUser, faUserSlash);

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $router: Router;
  }
}

const app = createApp(App);
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);
app.config.globalProperties.$router = router;
app.config.globalProperties.$emitter = emitter;
app.use(BootstrapVueNext);
router.isReady().then(() => app.mount('#app')); // Note: on Server Side, you need to manually push the initial location
