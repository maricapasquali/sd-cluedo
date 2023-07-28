import {createRouter, createWebHistory, Router} from 'vue-router';
import routes from './routes';
import {localGameStorageManager} from '@/services/localstoragemanager';

const router: Router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeResolve(to => {
  if (
    (to.name === 'waiting-room' || to.name === 'started-room') &&
    (localGameStorageManager.isEmpty() ||
      localGameStorageManager.localGame.identifier !== to.params.id)
  )
    return {name: 'home'};
  return true;
});

export default router;
