import {createRouter, createWebHistory, Router} from 'vue-router';
import routes from './routes';

const router: Router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
