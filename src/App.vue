<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white/95 backdrop-blur border-b px-3 sm:px-4 py-2">
      <div class="flex items-center justify-between gap-3">
        <RouterLink to="/" class="inline-flex items-center gap-2">
          <span class="text-2xl leading-none">💊</span>
          <h1 class="text-xl sm:text-2xl font-semibold text-gray-900">
            Аптека
          </h1>
        </RouterLink>

        <nav class="flex items-center gap-3">
          <RouterLink to="/orders" class="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
            🧾 <span>Заказы</span>
          </RouterLink>

          <RouterLink to="/favorites" class="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
            ⭐ <span>Избранное</span>
          </RouterLink>

          <CartBadge />
        </nav>
      </div>
    </header>

    <!-- Page -->
    <main class="px-3 sm:px-4 py-3">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import CartBadge from '@/components/CartBadge.vue'
import { RouterLink } from 'vue-router'

// (опционально) сообщаем Telegram, что веб-приложение готово
if (window?.Telegram?.WebApp?.ready) {
  window.Telegram.WebApp.ready()
}

</script>
