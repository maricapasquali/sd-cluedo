import {createApp} from 'vue';
import App from '@/App.vue';
import router from '@/router';
import BootstrapVueNext from 'bootstrap-vue-next';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

const app = createApp(App);
app.use(router);
app.use(BootstrapVueNext);
router.isReady().then(() => app.mount('#app')); // Note: on Server Side, you need to manually push the initial location
