import { createRouter, createWebHistory, type RouteRecordRaw, createWebHashHistory } from 'vue-router'
import OrderConfirmation from '@/views/OrderConfirmation.vue'

export const routes: Array<RouteRecordRaw> = [
  { 
    path: '/', 
    name: 'Home', 
    component: () => import('@/views/HomeView.vue'),
    meta: {
      showMainButton: true
    }
  },
  { 
    path: '/good/:id', 
    name: 'GoodDetail', 
    component: () => import('@/views/GoodDetailView.vue'), 
    props: true, 
    meta: { 
      hideHeader: true,
      showMainButton: false,
    } 
  },
  { 
    path: '/orders', 
    name: 'Orders', 
    component: () => import('@/views/OrdersView.vue') 
  },
  { 
    path: '/cart', 
    name: 'Cart', 
    component: () => import('@/views/CartView.vue'),
    meta: {
      showMainButton: true,
    }
  },
  { 
    path: '/favorites', 
    name: 'Favorites', 
    component: () => import('@/views/FavoritesView.vue') 
  },
  { 
    path: '/checkout', 
    name: 'checkout', 
    component: () => import('@/views/CheckoutView.vue'),
    meta: {
      showMainButton: true,
    }
  },
  { 
    path: '/order-confirmation', 
    name: 'OrderConfirmation', 
    component: OrderConfirmation 
  },
  { 
    path: '/search', 
    name: 'Search', 
    component: () => import('@/views/SearchView.vue') 
  },
  { 
    path: '/about', 
    name: 'About', 
    component: () => import('@/views/AboutView.vue') 
  },
]

const ua = navigator.userAgent
const isIOS = /iPhone|iPad|iPod/i.test(ua)
const isTelegram = /Telegram/i.test(ua)

// В Telegram на iOS — хеш-история, в остальных — обычная
const history = (isIOS && isTelegram)
  ? createWebHashHistory(import.meta.env.BASE_URL)
  : createWebHistory(import.meta.env.BASE_URL)

// ✅ Хранилище позиций скролла по роутам (в памяти)
const scrollPositions = new Map<string, number>()

function getScrollTop(): number {
  // максимально совместимо для WebView
  const el = document.scrollingElement
  return (
    (el && el.scrollTop) ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}

const router = createRouter({
  history,
  routes,

  // ✅ Восстановление скролла централизованно
  scrollBehavior(to, _from, savedPosition) {
    // 1) если это настоящий browser back/forward и Vue дал позицию
    if (savedPosition) return savedPosition

    // 2) если у нас есть сохранённая позиция для целевого роута
    const saved = scrollPositions.get(to.fullPath)
    if (typeof saved === 'number') {
      // Важно: в WebView/Telegram часто надо подождать 1–2 кадра
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve({ left: 0, top: saved }))
        })
      })
    }

    // 3) иначе стандарт: вверх
    return { left: 0, top: 0 }
  },
})

// ✅ Сохраняем скролл ДО ухода с текущего роута
router.beforeEach((_to, from) => {
  // сохраняем для любого роута, особенно для Home
  scrollPositions.set(from.fullPath, getScrollTop())
  return true
})

export default router
