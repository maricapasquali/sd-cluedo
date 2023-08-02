import {createRouter, createWebHistory, Router} from 'vue-router';
import routes from './routes';
import {localStoreManager} from '@/services/localstore';
import routesNames from './routesNames';

const router: Router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeResolve(to => {
  if (
    (to.name === routesNames.WAITING_ROOM ||
      to.name === routesNames.STARTED_ROOM) &&
    (localStoreManager.isEmpty() ||
      localStoreManager.game.identifier !== to.params.id)
  )
    return {name: routesNames.HOME};
  return true;
});

export default router;
