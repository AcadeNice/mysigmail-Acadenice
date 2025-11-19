import { createRouter, createWebHistory } from 'vue-router'

import CguPage from '@/pages/CguPage.vue'

const routes = [
  {
    path: '/',
    alias: ['/basic'],
    component: () => import('@/views/Basic.vue'),
    meta: {
      title: 'Basic signature details',
    },
  },
  {
    path: '/cgu',
    name: 'cgu',
    component: CguPage,
  },
  {
    path: '/social',
    component: () => import('@/views/Social.vue'),
    meta: {
      title: 'Social media links',
    },
  },
  {
    path: '/options',
    component: () => import('@/views/Options.vue'),
    meta: {
      title: 'Signature options',
    },
  },
  {
    path: '/addons',
    component: () => import('@/views/Addons.vue'),
    meta: {
      title: 'Signature addons',
    },
  },
  {
    path: '/templates',
    component: () => import('@/views/Templates.vue'),
    meta: {
      title: 'Templates',
    },
  },
  // New route for pixel analytics
  {
    path: '/analytics',
    component: () => import('@/views/PixelAnalytics.vue'),
    meta: {
      title: 'Pixel analytics',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
