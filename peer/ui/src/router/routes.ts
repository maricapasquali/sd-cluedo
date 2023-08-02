import {RouteRecordRaw} from 'vue-router';
import routesNames from './routesNames';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: routesNames.HOME,
    component: () => import('@/views/home/Home.vue'),
  },
  {
    path: '/waiting-room/:id',
    name: routesNames.WAITING_ROOM,
    component: () => import('@/views/waiting-room/WaitingRoom.vue'),
  },
  {
    path: '/started-room/:id',
    name: routesNames.STARTED_ROOM,
    component: () => import('@/views/started-room/StartedRoom.vue'),
  },
];
export default routes;
