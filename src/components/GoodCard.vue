<template>
  <!-- Контейнер-обёртка для оверлея избранного -->
  <div class="relative">
    <!-- ЕДИНЫЙ контейнер с рамкой: внутри и контент, и кнопка -->
    <div class="rounded-lg border bg-white shadow-sm overflow-hidden hover:bg-gray-50 transition">
      <!-- Кликабельная часть (переход на детали) -->
      <router-link :to="`/good/${good.good.id}`" class="block">
        <!-- изображение -->
        <div class="w-full h-32 sm:h-36 flex items-center justify-center bg-gray-50 overflow-hidden">
          <img
            v-if="imgToShow"
            :src="imgToShow"
            alt=""
            class="max-h-full object-contain"
            @error="onImgError"
          />
          <div v-else class="text-gray-400 text-sm">Нет изображения</div>
        </div>

        <!-- текст -->
        <div class="p-2">
          <div class="text-sm font-semibold line-clamp-2">
            {{ good.good.name }}
          </div>
          <div class="text-xs text-gray-500">
            {{ good.good.country || '—' }}
          </div>

          <div class="text-right text-green-600 font-bold mt-1">
            {{ priceText }}
          </div>
        </div>
      </router-link>

      <!-- Кнопка ВНУТРИ рамки -->
      <div class="p-2 pt-0">
        <button
          type="button"
          class="w-full rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50 active:translate-y-px"
          :disabled="!hasPrice || isAdded"
          :class="(!hasPrice || isAdded) ? 'opacity-40 cursor-not-allowed' : ''"
          @click.stop="addToCart"
        >
          {{ isAdded ? 'Добавлено ✅' : 'В корзину' }}
        </button>
      </div>
    </div>

    <!-- избранное (оверлей), клики не ведут на детали -->
    <button
      @click.stop="toggle"
      class="absolute top-2 right-2 z-10 rounded-full bg-white/90 shadow px-2 py-1"
      aria-label="Избранное"
      :aria-pressed="favorites.isFavorite(good.good.id)"
    >
      <span v-if="favorites.isFavorite(good.good.id)">❤️</span>
      <span v-else>🤍</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GoodWithStack } from '@/types/models'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useCartStore } from '@/stores/cartStore'
import { ref, watch, computed } from 'vue'

const props = defineProps<{ good: GoodWithStack }>()

const favorites = useFavoritesStore()
const cart = useCartStore()

/* Картинка с graceful degradation */
const imgIndex = ref(0)
const imgToShow = ref<string | null>(null)
const onImgError = () => {
  const list = (props.good.good.defaultImages ?? []).filter(Boolean)
  if (imgIndex.value < list.length - 1) {
    imgIndex.value++
    imgToShow.value = list[imgIndex.value] ?? null
  } else {
    imgToShow.value = null
  }
}
watch(
  () => props.good.good.defaultImages,
  () => {
    const list = (props.good.good.defaultImages ?? []).filter(Boolean)
    imgIndex.value = 0
    imgToShow.value = list[0] ?? null
  },
  { immediate: true }
)

/* Цена/штрихкод — как на деталке */
const hasPrice = computed(() => props.good.stock?.[0]?.webPrice != null)
const priceText = computed(() => {
  const p = props.good.stock?.[0]?.webPrice
  return p != null ? `${p} ₽` : 'Цена не указана'
})
const firstBarcode = computed(() => props.good.stock?.[0]?.barcode || '')

/* Поведение кнопки: “Добавлено ✅” на 1.5с */
const isAdded = ref(false)
const addToCart = () => {
  const bc = firstBarcode.value
  if (!bc) return
  cart.addToCart(bc)
  isAdded.value = true
  setTimeout(() => (isAdded.value = false), 1500)
}

/* Избранное */
const toggle = () => {
  favorites.toggleFavorite(props.good.good.id)
}
</script>
