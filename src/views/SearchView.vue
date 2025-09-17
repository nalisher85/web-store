<template>
  <div class="mx-auto w-full max-w-[1000px] px-3 sm:px-4 py-4">
    <!-- Поле поиска -->
    <div class="mb-3">
      <label for="q" class="sr-only">Поиск</label>
      <div class="relative">
        <input
          id="q"
          ref="inputEl"
          v-model.trim="q"
          type="text"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Поиск товаров…"
          class="w-full rounded-md border px-3 py-2 pr-16 outline-none focus:ring-2 focus:ring-indigo-500"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.enter.prevent="onEnter"
        />
        <!-- Кнопка очистки -->
        <button
          v-if="q"
          type="button"
          @click="clearQuery"
          class="absolute right-9 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100"
          aria-label="Очистить"
        >
          ×
        </button>
        <!-- Иконка лупы -->
        <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-60" viewBox="0 0 24 24" fill="none">
          <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 17-5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Состояния -->
    <div v-if="q.length > 0 && q.length < 2" class="py-8 text-center text-gray-500">Введите минимум 2 символа</div>
    <div v-else-if="loading" class="py-8 text-center text-gray-500">Поиск…</div>
    <div v-else-if="q.length >= 2 && results.length === 0" class="py-8 text-center text-gray-400">Ничего не найдено</div>

    <!-- Результаты -->
    <ul v-else class="divide-y">
      <li
        v-for="item in results"
        :key="item.good.id"
        class="py-3 hover:bg-gray-50 cursor-pointer"
        @pointerdown="onItemPointerDown"     
        @click="goToDetail(item.good.id)"   
      >
        <div class="flex items-center gap-3">
          <!-- Миниатюра 48x48 с плейсхолдером -->
          <div class="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
            <img
              v-if="hasImg(item) && !isBroken(item.good.id)"
              :src="firstImg(item)"
              alt="image"
              class="h-full w-full object-cover"
              @error="markBroken(item.good.id)"
            />
            <span v-else class="text-gray-400 text-[10px] leading-none text-center select-none">Нет фото</span>
          </div>

          <!-- Текст -->
          <div class="min-w-0 flex-1">
            <div class="font-medium truncate">{{ item.good.name }} </div>
            <div class="text-sm text-gray-600 truncate">
              {{ item.good.country || '—' }}
              <span v-if="minPrice(item) != null"> • {{ formatPrice(minPrice(item)!) }}</span>
            </div>
          </div>

          <!-- Кнопка В корзину (как на деталке) -->
          <div class="ml-2">
            <button
              type="button"
              class="rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-gray-50 active:translate-y-px"
              :disabled="!hasFirstPrice(item) || isAdded(item.good.id)"
              :class="(!hasFirstPrice(item) || isAdded(item.good.id)) ? 'opacity-40 cursor-not-allowed' : ''"
              @click.stop="quickAdd(item)"
              aria-label="Добавить в корзину"
            >
              {{ isAdded(item.good.id) ? 'Добавлено ✅' : 'В корзину' }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { searchGoods } from '@/api/search'
import { useCartStore } from '@/stores/cartStore'
import type { GoodWithStack, Stock } from '@/types/models'
import { useSearchStore } from '@/stores/searchStore'
import { useBackButton } from "@/composables/useBackButton";

useBackButton();


const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const { q, results } = storeToRefs(searchStore)
const cart = useCartStore()

const loading = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
const focused = ref(false)

/** тач-девайс? → первый тап закрывает клавиатуру только там */
const isTouchDevice = ref(false)
onMounted(() => {
  isTouchDevice.value =
    (navigator as any).maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window
})

let debounceTimer: number | undefined
let currentAbort: AbortController | null = null

/** Сессия поиска: сбрасываем стейт только при новом запуске через sid */
onMounted(() => {
  const sidParam = typeof route.query.sid === 'string' ? route.query.sid : null
  if (sidParam && sidParam !== searchStore.sessionId) {
    searchStore.clearAll()
    searchStore.setSession(sidParam)
    // убираем sid из адреса, не трогая роутер
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('sid')
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }
})

const fetchResults = async (query: string) => {
  if (currentAbort) currentAbort.abort()
  currentAbort = new AbortController()
  loading.value = true
  try {
    const data = await searchGoods(query, currentAbort.signal)
    searchStore.setResults(data)
    console.log("myLog data " + data)
  } finally {
    loading.value = false
  }
}

watch(q, (val) => {
  searchStore.setQuery(val)
  if (val.length < 2) {
    searchStore.setResults([])
    if (debounceTimer) window.clearTimeout(debounceTimer)
    if (currentAbort) currentAbort.abort()
    return
  }
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => fetchResults(val), 1000)
})

onBeforeUnmount(() => {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  if (currentAbort) currentAbort.abort()
})

/** Мобильное: если клавиатура открыта — первый тап закрывает её и отменяет click */
const onItemPointerDown = (e: PointerEvent) => {
  if (isTouchDevice.value && document.activeElement === inputEl.value) {
    e.preventDefault()
    e.stopPropagation()
    inputEl.value?.blur()
  }
}

const goToDetail = (id: number) => {
  router.push({ name: 'GoodDetail', params: { id } })
}

const clearQuery = () => searchStore.clearAll()
const onEnter = () => inputEl.value?.blur()

/** ---- Быстрое добавление (как на детальной): “Добавлено ✅” на 1.5с ---- */
const addedIds = ref<Set<number>>(new Set())
const isAdded = (id: number) => addedIds.value.has(id)

const firstBarcode = (it: GoodWithStack) => it.stock?.[0]?.barcode || ''
const hasFirstPrice = (it: GoodWithStack) => it.stock?.[0]?.webPrice != null

const quickAdd = (it: GoodWithStack) => {
  const bc = firstBarcode(it)
  if (!bc) return
  cart.addToCart(bc)
  // флажок «добавлено» на 1.5 сек
  const s = new Set(addedIds.value)
  s.add(it.good.id)
  addedIds.value = s
  setTimeout(() => {
    const s2 = new Set(addedIds.value)
    s2.delete(it.good.id)
    addedIds.value = s2
  }, 1500)
}

/** ---- Плейсхолдер/ошибки картинок ---- */
const broken = ref<Set<number>>(new Set())
const markBroken = (id: number) => {
  if (!broken.value.has(id)) {
    const s = new Set(broken.value)
    s.add(id)
    broken.value = s
  }
}
const isBroken = (id: number) => broken.value.has(id)
const hasImg = (it: GoodWithStack) =>
  Array.isArray(it.good.defaultImages) && !!it.good.defaultImages[0]
const firstImg = (it: GoodWithStack) => (hasImg(it) ? it.good.defaultImages[0] : '')

/** ---- Цена ---- */
const minPrice = (it: GoodWithStack): number | null => {
  const prices = (it.stock ?? [])
    .map((s: Stock) => s.webPrice)
    .filter((p): p is number => typeof p === 'number')
  return prices.length ? Math.min(...prices) : null
}
const formatPrice = (n: number) => {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `${n} ₽`
  }
}
</script>
