<!-- src/views/GoodDetailView.vue -->
<template>
  <div class="p-6 max-w-xl mx-auto">
    <!-- Название / страна -->
    <h1 class="text-2xl font-bold mb-1">{{ good?.good.name }}</h1>
    <p class="text-gray-500 mb-4">{{ good?.good.country }}</p>

    <!-- Галерея: сначала фото варианта (если есть), иначе фото товара -->
    <ImageGallery :images="galleryImages" />

    <!-- Цена и остаток выбранного варианта -->
    <div class="my-4 flex items-baseline gap-3">
      <div class="text-green-600 font-bold text-xl">
        {{ hasPrice ? formatPrice(selected!.webPrice!) : 'Цена уточняется' }}
      </div>
      <div v-if="selected" class="text-xs text-gray-500">
        Остаток: {{ formatCount(selected.count) }}
      </div>
    </div>

    <!-- Выбор модификации (варианта) -->
    <section v-if="variants.length" class="mb-4">
      <h2 class="font-semibold mb-2">Модификация</h2>

      <div v-if="variants.length > 5" class="relative">
        <select
          class="w-full rounded border px-3 py-2 bg-white"
          v-model="selectedIdx"
        >
          <option
            v-for="(v, i) in variants"
            :key="v.barcode"
            :value="i"
            :disabled="!isVariantPurchasable(v)"
          >
            {{ variantLabel(v) }}
          </option>
        </select>
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="(v, i) in variants"
          :key="v.barcode"
          type="button"
          class="px-3 py-1.5 rounded-full border text-sm transition"
          :class="[
            i === selectedIdx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white',
            !isVariantPurchasable(v) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          ]"
          :disabled="!isVariantPurchasable(v)"
          @click="selectedIdx = i"
        >
          {{ variantLabel(v) }}
        </button>
      </div>
    </section>

    <!-- Кнопки -->
    <div class="flex gap-4">
      <button
        v-if="!isMainButtonActive"
        :class="[
          'px-4 py-2 rounded bg-gray-100 transition',
          canAddToCart ? 'text-black hover:bg-gray-200 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
        ]"
        :disabled="!canAddToCart"
        @click="handleAddToCart"
      >
        {{ isAdded ? 'Добавлено ✅' : 'В корзину' }}
      </button>

      <button @click="toggleFavorite" class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
        <span v-if="isFavorite">Удалить из избранного ❤️</span>
        <span v-else>Добавить в избранное 🤍</span>
      </button>
    </div>

    <!-- Описание -->
    <section class="mt-6 space-y-2" v-if="good?.good.description">
      <h2 class="font-semibold">Описание</h2>
      <p class="text-sm text-gray-700 whitespace-pre-line">{{ good!.good.description }}</p>
    </section>

    <!-- Характеристики выбранной модификации -->
    <section class="mt-4" v-if="selected">
      <h2 class="font-semibold mb-2">Характеристики</h2>

      <ul class="text-sm text-gray-700 space-y-1">
        <!-- Значения из stock.goodProperties -->
        <li
          v-for="p in selected.goodProperties"
          :key="p.propertyName"
          class="flex gap-2"
        >
          <span class="text-gray-500">{{ p.propertyName }}:</span>
          <span>{{ prettyPropertyValue(p.value) }}</span>
        </li>

        <!-- Доп. свойства из stock.extraProperties -->
        <li
          v-for="(val, key) in selected.extraProperties"
          :key="'extra-' + key"
          class="flex gap-2"
        >
          <span class="text-gray-500">{{ key }}:</span>
          <span>{{ val }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import ImageGallery from '@/components/ImageGallery.vue'
import { useGoodsStore } from '@/stores/goodsStore'
import { useCartStore } from '@/stores/cartStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import type { Stock } from '@/types/models'
import type { StockNS } from '@/types/models'
import { useBackButton } from '@/composables/useBackButton'
import { useMainButton } from '@/composables/useMainButton'

useBackButton()

const route = useRoute()
const goodsStore = useGoodsStore()
const { good } = storeToRefs(goodsStore)

const cart = useCartStore()
const favorites = useFavoritesStore()

// --- варианты / выбор ---
const selectedIdx = ref<number>(0)
const variants = computed<Stock[]>(() => good.value?.stock ?? [])
const selected = computed<Stock | undefined>(() => variants.value[selectedIdx.value])

watch(variants, (list) => {
  if (!list?.length) { selectedIdx.value = 0; return }
  const idx = list.findIndex(s => isVariantPurchasable(s))
  selectedIdx.value = idx >= 0 ? idx : 0
}, { immediate: true })

// --- избранное ---
const toggleFavorite = () => {
  const id = good.value?.good.id
  if (id) favorites.toggleFavorite(id)
}
const isFavorite = computed(() => {
  const id = good.value?.good.id
  return id ? favorites.isFavorite(id) : false
})

// --- цена / доступность ---
const hasPrice = computed(() => !!selected.value && typeof selected.value.webPrice === 'number')
const canAddToCart = computed(() => {
  const s = selected.value
  return !!(s && s.barcode && typeof s.webPrice === 'number' && (s.count ?? 0) > 0)
})

// --- корзина ---
const isAdded = ref(false)
function handleAddToCart() {
  const s = selected.value
  if (!s?.barcode) return
  cart.addToCart(s.barcode)
  isAdded.value = true
  setTimeout(() => (isAdded.value = false), 1500)
}

// --- системная кнопка Telegram ---
const { isMainButtonActive, setEnabled, setText } = useMainButton({
  text: 'В корзину',
  onClick: handleAddToCart,
})
watch([canAddToCart, selected], ([ok, s]) => {
  setEnabled(!!ok)
  if (s?.webPrice != null) {
    setText(`В корзину · ${formatPrice(s.webPrice)}`)
  } else {
    setText('В корзину')
  }
}, { immediate: true })

// --- загрузка товара ---
onMounted(() => {
  const id = Number(route.params.id)
  if (!isNaN(id)) goodsStore.loadGood(id)
})

// --- утилиты ---
function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'TJS', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n} TJS`
  }
}
function formatCount(c: number) {
  return Number.isInteger(c) ? String(c) : c.toFixed(2)
}

// Лейбл варианта
function variantLabel(v: Stock) {
  const base = v.overriddenName?.trim()
  const props = (v.goodProperties ?? [])
    .map(p => `${p.propertyName}: ${prettyPropertyValue(p.value)}`)
    .slice(0, 3)
    .join(', ')
  const price = typeof v.webPrice === 'number' ? ` · ${formatPrice(v.webPrice)}` : ''
  return base || (props ? props + price : `Вариант ${v.barcode}${price}`)
}

// Читабельное значение StockNS.PropertyValue
function prettyPropertyValue(val: StockNS.PropertyValue): string {
  switch (val.type) {
    case 'StringValue':  return String(val.value ?? '')
    case 'NumberValue':  return String(val.value ?? '')
    case 'IntValue':     return String(val.value ?? '')
    case 'BooleanValue': return val.value ? 'Да' : 'Нет'
    default:             return ''
  }
}

function isVariantPurchasable(v: Stock) {
  return typeof v.webPrice === 'number' && (v.count ?? 0) > 0
}

// Картинки: приоритет у выбранного варианта
const galleryImages = computed(() => {
  const g = good.value?.good.defaultImages ?? []
  const sImgs = selected.value?.images ?? []
  return (sImgs.length ? sImgs : g)
})
</script>