import { createRouter, createWebHistory } from 'vue-router'

import CguPage from '@/pages/CguPage.vue'

const routes = [
  // New welcome page on "/"
  {
    path: '/',
    name: 'welcome',
    component: () => import('@/views/WelcomePage.vue'),
    meta: {
      title: 'AcadéNice — Générateur de signature',
      public: true,
    },
  },

  // Main app entry (Basic) – now only on /basic
  {
    path: '/basic',
    alias: [], // no alias "/"
    component: () => import('@/views/Basic.vue'),
    meta: {
      title: 'Infos',
    },
  },

  {
    path: '/cgu',
    name: 'cgu',
    component: CguPage,
    meta: {
      public: true,
    },
  },
  {
    path: '/social',
    component: () => import('@/views/Social.vue'),
    meta: {
      title: 'Liens vers les réseaux sociaux',
    },
  },
  {
    path: '/options',
    component: () => import('@/views/Options.vue'),
    meta: {
      title: 'Options de signature',
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
  // {
  //   path: '/analytics',
  //   component: () => import('@/views/PixelAnalytics.vue'),
  //   meta: {
  //     title: 'Pixel analytics',
  //   },
  // },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
