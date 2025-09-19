<template>
  <div class="p-6 max-w-xl mx-auto">
    <!-- Название, страна -->
    <h1 class="text-2xl font-bold mb-1">{{ good?.good.name }}</h1>
    <p class="text-gray-500 mb-4">{{ good?.good.country }}</p>

    <!-- Галерея -->
    <ImageGallery :images="good?.good.defaultImages || []" />

 <!-- Цена + остаток + кнопка Избранное справа -->
<div class="flex items-center justify-between my-4">
  <div class="flex items-center gap-3">
    <div class="text-green-600 font-bold text-xl">
      <span v-if="selectedStock">
        {{ formatPrice(selectedStock.webPrice ?? 0) }}
      </span>
      <span v-else class="text-gray-400">Цена не указана</span>
    </div>
  </div>

  <!-- Кнопка «В избранное» -->
  <button
    @click="toggleFavorite"
    class="px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-gray-50 active:translate-y-px"
  >
    {{ isFavorite ? 'В избранном ❤️' : 'В избранное 🤍' }}
  </button>
</div>

    <!-- Модификации -->
    <section v-if="hasVariants" class="mb-4">
      <h2 class="font-semibold text-lg mb-2">Модификации</h2>

      <!-- Список вариантов как "flow chips" -->
      <div class="flex flex-wrap gap-2">
        <button v-for="(s, idx) in good!.stock" :key="s.barcode || idx" type="button" @click="selectVariant(idx)" class="inline-flex items-center rounded-full border px-3 py-1.5 max-w-full transition
           whitespace-normal break-words leading-snug
           hover:bg-gray-50" :class="idx === selectedIndex
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-800 border-gray-200'" aria-label="Выбрать модификацию">
          <!-- Текст вариантов: разрешаем переносы -->
          <span class="mr-2 break-words">
            {{ variantLabel(s) }}
          </span>
          <!-- Цена: не сжимать, но и не раздвигать чип на всю ширину -->
          <span class="shrink-0 text-sm opacity-80">
            {{ formatPrice(s.webPrice ?? 0) }}
          </span>
        </button>
      </div>

    </section>

    <!-- Описание -->
    <section v-if="good?.good.description" class="mt-4">
      <h3 class="font-semibold text-lg mb-1">Описание</h3>
      <p class="text-gray-700">{{ good!.good.description }}</p>
    </section>

    <!-- Характеристики выбранной модификации -->
    <section v-if="selectedProps.length" class="mt-4">
      <h3 class="font-semibold text-lg mb-1">Характеристики</h3>
      <dl class="grid grid-cols-1 gap-y-1 text-gray-700">
        <div v-for="p in selectedProps" :key="p.propertyName" class="flex gap-2">
          <dt class="w-48 text-gray-500">{{ p.propertyName }}:</dt>
          <dd class="flex-1">{{ valueToText(p.value) }}</dd>
        </div>
      </dl>
    </section>

    <!-- Резервная кнопка (если системная скрыта) -->
    <div v-if="!isMainButtonActive" class="mt-6">
      <button
        class="w-full rounded-lg bg-indigo-600 text-white text-base py-3 font-semibold active:translate-y-px disabled:opacity-50"
        :disabled="!canAddToCart" @click="handleAddToCart">
        {{ selectedStock ? `В корзину · ${formatPrice(selectedStock.webPrice ?? 0)}` : 'В корзину' }}
      </button>
    </div>
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
import type { Stock, StockNS } from '@/types/models'
import { useBackButton } from "@/composables/useBackButton";
import { useMainButton } from "@/composables/useMainButton";

useBackButton();

const route = useRoute()
const store = useGoodsStore()
const { good } = storeToRefs(store)
const cart = useCartStore()
const favorites = useFavoritesStore()

/** --- Выбор варианта --- */
const selectedIndex = ref<number>(0)

const hasVariants = computed(() =>
  Array.isArray(good.value?.stock) && good.value!.stock.length > 0
)

const selectedStock = computed<Stock | null>(() => {
  if (!hasVariants.value) return null
  const idx = Math.min(selectedIndex.value, good.value!.stock.length - 1)
  return good.value!.stock[idx] ?? null
})

const selectedProps = computed(() => {
  const props = selectedStock.value?.goodProperties ?? []
  // чуть упорядочим, чтобы не прыгало
  return [...props].sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, 'ru')
  )
})

function selectVariant(idx: number) {
  selectedIndex.value = idx
}

/** --- Избранное --- */
const isFavorite = computed(() =>
  good.value?.good.id ? favorites.isFavorite(good.value.good.id) : false
)
const toggleFavorite = () => {
  if (good.value?.good.id) favorites.toggleFavorite(good.value.good.id)
}

/** --- Добавление в корзину --- */
const canAddToCart = computed(() => {
  const s = selectedStock.value
  return Boolean(s?.barcode) && typeof s?.webPrice === 'number'
})

function handleAddToCart() {
  const s = selectedStock.value
  if (!s?.barcode) return
  cart.addToCart(s.barcode)
}

/** --- MainButton (Telegram) --- */
const { isMainButtonActive, setEnabled, setText } = useMainButton({
  text: "В корзину",
  onClick: handleAddToCart,
})
watch(canAddToCart, (ok) => setEnabled(!!ok), { immediate: true })
watch(selectedStock, (s) => {
  if (s?.webPrice != null) {
    setText(`В корзину · ${formatPrice(s.webPrice)}`)
  } else {
    setText("В корзину")
  }
}, { immediate: true })

/** --- Загрузка товара --- */
onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    await store.loadGood(id)
    // при первом заходе всегда выбираем 1-й вариант
    selectedIndex.value = 0
  }
})

/** --- Вспомогательные --- */
function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'TJS', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n} TJS`
  }
}

/** Значение StockNS.PropertyValue -> текст */
function valueToText(v: StockNS.PropertyValue): string {
  switch (v.type) {
    case 'StringValue': return String(v.value)
    case 'NumberValue': return String(v.value)
    case 'IntValue': return String(v.value)
    case 'BooleanValue': return v.value ? 'Да' : 'Нет'
    default: return ''
  }
}

/** Подпись варианта: "Имя: Значение, Имя: Значение" */
function variantLabel(s: Stock): string {
  const props = Array.isArray(s.goodProperties) ? s.goodProperties : []
  if (!props.length) return s.overriddenName || 'Вариант'

  const sorted = [...props].sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, 'ru')
  )

  return sorted
    .map(p => `${p.propertyName}: ${valueToText(p.value)}`)
    .join(', ')
}
</script>