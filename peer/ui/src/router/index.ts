import {createRouter, createWebHistory, Router} from 'vue-router';
import routes from './routes';

const router: Router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeResolve((to, from) => {
  const localGame = JSON.parse(window.localStorage.getItem('game') || '{}');
  if (
    (to.name === 'waiting-room' || to.name === 'started-room') &&
    (Object.keys(localGame).length === 0 ||
      localGame.game.identifier !== to.params.id)
  )
    return {name: 'home'};
  return true;
});

export default router;
