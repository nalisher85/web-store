<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header
      v-if="showHeader"
      class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-3 sm:px-4 pt-2"
      :style="{
        paddingTop: 'calc(var(--tma-safe-area-top, env(safe-area-inset-top)) + 6px)',
      }"
    >
      <!-- Ряд 1: центрируем заголовок между нативными кнопками (Close / ... ) -->
      <div
        class="grid items-center"
        :style="{
          gridTemplateColumns: 'var(--tma-native-side, 68px) 1fr var(--tma-native-side, 68px)',
          minHeight: '40px',
        }"
      >
        <!-- Левый резерв под нативную кнопку -->
        <div aria-hidden="true"></div>

        <!-- ЦЕНТР: переход на главную -->
        <RouterLink
          to="/"
          class="flex items-center justify-center gap-2 no-underline text-inherit"
          style="pointer-events: auto"
        >
          <h1 class="text-xl sm:text-2xl font-semibold text-gray-900">
            СтройДом
          </h1>
        </RouterLink>

        <!-- Правый резерв под нативную кнопку -->
        <div aria-hidden="true"></div>
      </div>

      <!-- Ряд 2: навигация -->
      <nav class="mt-2 flex items-center gap-3 justify-end">
        <!-- О нас — всегда -->
        <RouterLink
          :to="{ name: 'About' }"
          class="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
        >
          ℹ️ <span>О нас</span>
        </RouterLink>

        <!-- Заказы — только в TMA -->
        <RouterLink
          v-if="hasTma"
          to="/orders"
          class="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
        >
          🧾 <span>Заказы</span>
        </RouterLink>

        <!-- Избранные — всегда -->
        <RouterLink
          to="/favorites"
          class="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
        >
          ❤️ <span>Избранные</span>
        </RouterLink>

        <!-- Корзина — только в TMA -->
        <CartBadge v-if="hasTma" />
      </nav>
    </header>

    <!-- Content -->
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <keep-alive include="Home">
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </main>

  </div>
</template>

<script setup lang="ts">
import CartBadge from '@/components/CartBadge.vue'
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { getTmaInitData } from '@/utils/tma'

const route = useRoute()
const showHeader = computed(() => !route.meta.hideHeader)

// Если есть initData — значит TMA, иначе браузер
const hasTma = computed(() => !!getTmaInitData())

// На всякий случай — если открыто в Telegram
if ((window as any)?.Telegram?.WebApp?.ready) {
  ;(window as any).Telegram.WebApp.ready()
}
</script>
