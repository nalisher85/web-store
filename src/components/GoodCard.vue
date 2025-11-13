<template>
  <div class="relative">
    <div class="rounded-lg border bg-white shadow-sm overflow-hidden hover:bg-gray-50 transition">
      <router-link :to="`/good/${g.good.id}`" class="block">
        <!-- Изображение -->
        <div class="w-full h-32 sm:h-36 flex items-center justify-center bg-gray-50 overflow-hidden">
          <img
            v-if="cover"
            :src="cover"
            :alt="g.good.name"
            class="max-h-full object-contain"
            loading="lazy"
            @error="onImgError"
          />
          <div v-else class="text-gray-400 text-sm">Нет изображения</div>
        </div>

        <!-- Текстовая часть -->
        <div class="p-3">
          <div class="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
            {{ g.good.name }}
          </div>

          <div class="mt-1.5 flex items-center justify-between gap-2 flex-nowrap min-w-0">
            <span v-if="minPrice !== null" class="text-base font-semibold whitespace-nowrap">
              от {{ formatPrice(minPrice) }}
            </span>
            <span v-else class="text-gray-400 text-sm whitespace-nowrap">Цена уточняется</span>

            <!-- бейдж показываем только если вариантов > 1 -->
            <span
              v-if="showVariants"
              class="shrink-0 whitespace-nowrap text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {{ variantsLabel }}
            </span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Избранное -->
    <button
      v-if="favoritesAvailable"
      @click.stop="toggleFavorite"
      class="absolute top-2 right-2 z-10 rounded-full bg-white/90 shadow px-2 py-1"
      aria-label="Избранное"
      :aria-pressed="isFav"
    >
      <span v-if="isFav">❤️</span>
      <span v-else>🤍</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GoodWithStock, Stock } from '@/types/models'
import { useFavoritesStore } from '@/stores/favoritesStore'

const props = defineProps<{ good: GoodWithStock }>()
const g = computed(() => props.good)

/** Favorites */
let favorites: ReturnType<typeof useFavoritesStore> | null = null
try {
  favorites = useFavoritesStore()
} catch {
  favorites = null
}
const favoritesAvailable = computed(() => !!favorites)
const isFav = computed(() => (favorites ? favorites.isFavorite(g.value.good.id) : false))
const toggleFavorite = () => { if (favorites) favorites.toggleFavorite(g.value.good.id) }

/** Картинка: сперва из товара, иначе из первого варианта */
const cover = computed(() => {
  const fromGood = g.value.good?.defaultImages?.[0]
  if (fromGood) return fromGood
  return g.value.stock?.[0]?.images?.[0] ?? null
})
const onImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none'
}

/** “Цена от …”: минимальная среди вариантов с webPrice > 0 и count > 0 */
const minPrice = computed<number | null>(() => {
  const prices = (g.value.stock ?? [])
    .filter((s: Stock) => (s.webPrice ?? 0) > 0 && (s.count ?? 0) > 0)
    .map((s: Stock) => s.webPrice as number)
  if (!prices.length) return null
  return prices.reduce((m, p) => (p < m ? p : m), prices[0])
})
const variantsLabel = computed(() => `${g.value.stock?.length ?? 0} вар.`)
const showVariants = computed(() => (g.value.stock?.length ?? 0) > 1)

/* Утилиты */
function formatPrice(n: number) {
    const isInt = Number.isInteger(n)
  try {

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'TJS',
      minimumFractionDigits: isInt ? 0 : 0,
      maximumFractionDigits: isInt ? 0 : 2,
    }).format(n)
  } catch {
    // fallback
    return isInt ? `${n} TJS` : `${n.toFixed(2)} TJS`
  }
}
</script>