import { createRouter, createWebHistory, type RouteRecordRaw, createWebHashHistory } from 'vue-router'


export const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/good/:id',
    name: 'GoodDetail',
    component: () => import('@/views/GoodDetailView.vue'),
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/OrdersView.vue'),
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/CartView.vue'),
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/CheckoutView.vue'),
  },
  {
    path: '/order-confirmation',
    name: 'order-confirmation',
    component: () => import('@/views/OrderConfirmation.vue'),
  },
    {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchView.vue'),
  },
]

const ua = navigator.userAgent
const isIOS = /iPhone|iPad|iPod/i.test(ua)
const isTelegram = /Telegram/i.test(ua)

// В Telegram на iOS — хеш-история, в остальных — обычная
const history = (isIOS && isTelegram)
  ? createWebHashHistory(import.meta.env.BASE_URL)
  : createWebHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes,
  scrollBehavior() { return { top: 0 } }
})

// const router = createRouter({
//   history: createWebHistory(),
//   routes,
// })

export default router
