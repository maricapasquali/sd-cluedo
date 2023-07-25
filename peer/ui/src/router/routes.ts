import {RouteRecordRaw} from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/waiting-room/:id',
    name: 'waiting-room',
    component: () => import('@/views/WaitingRoom.vue'),
  },
  {
    path: '/started-room/:id',
    name: 'started-room',
    component: () => import('@/views/StartedRoom.vue'),
  },
];
export default routes;
