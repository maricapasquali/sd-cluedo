import {createApp} from 'vue';
import App from './src/App.vue';
import router from './src/router';
import BootstrapVueNext from 'bootstrap-vue-next';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import {Router} from 'vue-router';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $router: Router;
  }
}

const app = createApp(App);
app.use(router);
app.config.globalProperties.$router = router;
app.use(BootstrapVueNext);
router.isReady().then(() => app.mount('#app')); // Note: on Server Side, you need to manually push the initial location
