<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto max-w-xl">
      <!-- HERO: Картинка ~80% высоты экрана -->
      <section class="relative w-full h-[80vh] overflow-hidden bg-white">
        <ImageGallery :key="galleryKey" :images="galleryImages" class="h-full" />

        <!-- Кнопка Поделиться (иконка) -->
        <button type="button" @click="shareProduct" :disabled="!deepLink"
          class="absolute left-3 p-2 rounded-full bg-white/80 backdrop-blur shadow border active:translate-y-px disabled:opacity-40 z-20"
          :style="{ bottom: '24px' }" aria-label="Поделиться товаром">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 16V4" />
            <path d="m8 8 4-4 4 4" />
          </svg>
        </button>

        <!-- Кнопка Избранное (иконка) -->
        <button type="button" @click="toggleFavorite"
          class="absolute right-3 p-2 rounded-full bg-white/80 backdrop-blur shadow border active:translate-y-px z-20"
          :style="{ bottom: '24px' }" :aria-label="isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'">
          <!-- НЕактивное состояние: серый контур -->
          <svg v-if="!isFavorite" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path
              d="M12.1 20.3C7.1 15.9 4 13.1 4 9.5 4 7 6 5 8.5 5c1.7 0 3.4 1 4.1 2.6C13.1 6 14.8 5 16.5 5 19 5 21 7 21 9.5c0 3.6-3.1 6.4-8.1 10.8l-.9.8-.9-.8z" />
          </svg>

          <!-- Активное состояние: красное залитое -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 24 24"
            fill="currentColor">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4 8.24 4 9.91 4.81 11 6.08 12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        <!-- Кнопка Корзина (иконка, только TMA) -->
        <button v-if="hasTma" type="button" @click="router.push('/cart')"
          class="absolute p-2 rounded-full bg-white/80 backdrop-blur shadow border active:translate-y-px z-20"
:style="{ bottom: '24px', right: '70px' }" aria-label="Перейти в корзину">
          <!-- иконка корзины -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.6 13.6a2 2 0 0 0 2 1.4h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>

          <!-- badge -->
          <span v-if="cartCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center">
            {{ cartCount }}
          </span>
        </button>

      </section>

      <!-- Основной контент -->
      <div class="px-4 pb-32">
        <!-- Цена -->
        <div class="my-4">
          <div class="flex flex-wrap items-center gap-2">
            <div class="text-green-600 font-bold text-xl mr-auto">
              <span v-if="selectedStock">
                {{ formatPrice(selectedStock.webPrice ?? 0) }}
              </span>
              <span v-else class="text-gray-400">Цена не указана</span>
            </div>
          </div>

          <p v-if="shareHint" class="text-xs text-gray-500 mt-1 text-right">
            {{ shareHint }}
          </p>
        </div>

        <!-- Название товара -->
        <h1 v-if="good" class="text-2xl font-bold mb-3">
          {{ good.good.name }}
        </h1>

        <!-- Модификации -->
        <section v-if="hasMoreThenOne" class="mb-4">
          <h2 class="font-semibold text-lg mb-2">Модификации</h2>

          <div class="flex flex-wrap gap-2">
            <button v-for="(s, idx) in good!.stock" :key="s.barcode || idx" type="button" @click="selectVariant(idx)"
              class="rounded-full border max-w-full transition" :class="idx === selectedIndex
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-600'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'" aria-label="Выбрать модификацию">

              <div class="flex items-center w-full gap-3 py-3 pl-6 pr-5">
                <span class="flex-1 min-w-0 break-words leading-normal text-left">
                  {{ variantLabel(s) }}
                </span>
                <span class="shrink-0 text-sm opacity-80">
                  {{ formatPrice(s.webPrice ?? 0) }}
                </span>
              </div>
            </button>
          </div>
        </section>

        <!-- Описание -->
        <section v-if="good?.good.description" class="mt-4">
          <h3 class="font-semibold text-lg mb-1">Описание</h3>
          <p class="text-gray-700 break-words">
            <template v-for="(part, idx) in descriptionParts" :key="idx">
              <span v-if="part.type === 'text'">
                {{ part.content }}
              </span>

              <a v-else-if="part.type === 'link'" :href="part.content" class="text-indigo-600 underline break-all"
                target="_blank" rel="noopener noreferrer">
                {{ part.content }}
              </a>

              <br v-else />
            </template>
          </p>
        </section>

        <!-- Характеристики -->
        <section v-if="selectedProps.length" class="mt-4">
          <h3 class="font-semibold text-lg mb-1">Характеристики</h3>
          <dl class="grid grid-cols-1 gap-y-1 text-gray-700">
            <div v-for="p in selectedProps" :key="p.propertyName" class="flex gap-2">
              <dt class="w-48 text-gray-500">{{ p.propertyName }}:</dt>
              <dd class="flex-1">{{ valueToText(p.value) }}</dd>
            </div>
          </dl>
        </section>

        <!-- Fixed bottom action -->
        <div class="sticky bottom-0 z-40 bg-white border-t" :style="{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        }">
          <div class="mx-auto max-w-xl px-4 pt-3">
            <button
              class="w-full rounded-lg bg-indigo-600 text-white text-base py-3 font-semibold active:translate-y-px disabled:opacity-50"
              :disabled="hasTma && !canAddToCart" @click="hasTma ? handleAddToCart() : openTelegram()">
              <template v-if="hasTma">
                {{ selectedStock ? `В корзину · ${formatPrice(selectedStock.webPrice ?? 0)}` : 'В корзину' }}
              </template>
              <template v-else>
                Открыть в телеграм
              </template>
            </button>
          </div>
        </div>


      </div>
    </div>

    <!-- Модалка «Поделиться» -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="showShareModal = false">
      <div class="bg-white rounded-xl p-4 w-72 shadow-lg">
        <h3 class="font-semibold text-lg mb-3">Поделиться</h3>
        <div class="flex flex-col gap-2">
          <button @click="openTelegramShare" class="py-2 px-3 border rounded hover:bg-gray-50">
            Telegram
          </button>
          <button @click="openWhatsAppShare" class="py-2 px-3 border rounded hover:bg-gray-50">
            WhatsApp
          </button>
          <button @click="copyLink" class="py-2 px-3 border rounded hover:bg-gray-50">
            Скопировать ссылку
          </button>
        </div>
        <button @click="showShareModal = false"
          class="mt-4 w-full py-2 px-3 border rounded bg-gray-100 hover:bg-gray-200">
          Отмена
        </button>
      </div>
    </div>

    <!-- mini-toast -->
    <transition name="fade">
      <div v-if="snackVisible"
        class="fixed left-1/2 bottom-24 -translate-x-1/2 px-3 py-2 rounded-full bg-black/80 text-white text-sm z-50">
        {{ snackText }}
      </div>
    </transition>
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
import { useBackButton } from '@/composables/useBackButton'
import WebApp from '@twa-dev/sdk'
import { BOT_USERNAME } from '@/config'
import { getTmaInitData } from '@/utils/tma'
import { useRouter } from 'vue-router'

const router = useRouter()

const hasTma = computed(() => !!getTmaInitData())

useBackButton()

const route = useRoute()
const store = useGoodsStore()
const { good } = storeToRefs(store)
const cart = useCartStore()
const favorites = useFavoritesStore()

const cartCount = computed(() => cart.items.length)

/* Галерея */
const selectedIndex = ref<number>(0)
const galleryImages = computed(() => {
  const stockImgs = selectedStock.value?.images ?? []
  return stockImgs.length ? stockImgs : (good.value?.good.defaultImages ?? [])
})
const galleryKey = computed(() => `${good.value?.good.id ?? 'x'}-${selectedIndex.value}`)

/* Варианты */
const hasVariants = computed(
  () => Array.isArray(good.value?.stock) && good.value!.stock.length > 0,
)
const hasMoreThenOne = computed(
  () => Array.isArray(good.value?.stock) && good.value!.stock.length > 1,
)
const selectedStock = computed<Stock | null>(() => {
  if (!hasVariants.value) return null
  const idx = Math.min(selectedIndex.value, good.value!.stock.length - 1)
  return good.value!.stock[idx] ?? null
})

/* Характеристики + страна */
const selectedProps = computed(() => {
  const baseProps = [...(selectedStock.value?.goodProperties ?? [])]

  if (good.value?.good.country) {
    baseProps.push({
      propertyName: 'Страна',
      value: {
        type: 'StringValue',
        value: good.value.good.country,
      } as StockNS.PropertyValue,
    })
  }

  return baseProps.sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, 'ru'),
  )
})

function selectVariant(idx: number) {
  selectedIndex.value = idx
}

function openTelegram() {
  if (!good.value?.good.id) return
  const url = `https://telegram.me/${BOT_USERNAME}?start=good_${good.value.good.id}-browserMode`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/* Избранное */
const isFavorite = computed(() =>
  good.value?.good.id ? favorites.isFavorite(good.value.good.id) : false,
)
const toggleFavorite = () => {
  if (!good.value?.good.id) return
  favorites.toggleFavorite(good.value.good.id)
}

/* Корзина */
const canAddToCart = computed(() => {
  const s = selectedStock.value
  return Boolean(s?.barcode) && typeof s?.webPrice === 'number'
})

function handleAddToCart() {
  const s = selectedStock.value
  if (!s?.barcode) return
  cart.addToCart(s.barcode)

  try {
    WebApp.HapticFeedback?.notificationOccurred?.('success')
  } catch { }

  showSnack('Добавлено в корзину')
}

const snackVisible = ref(false)
const snackText = ref('')
let snackTimer: number | undefined

function showSnack(msg: string) {
  snackText.value = msg
  snackVisible.value = true
  if (snackTimer) clearTimeout(snackTimer as any)
  // @ts-ignore
  snackTimer = setTimeout(() => {
    snackVisible.value = false
  }, 1400)
}

/* Deep-link + Share */
const deepLink = computed(() =>
  good.value?.good.id
    ? `https://telegram.me/${BOT_USERNAME}?start=good_${good.value.good.id}-share`
    : '',
)
const shareHint = ref('')
const showShareModal = ref(false)

function showShareHint(msg: string) {
  shareHint.value = msg
  window.setTimeout(() => (shareHint.value = ''), 2000)
}

async function copyLink() {
  if (!deepLink.value) return
  try {
    await navigator.clipboard.writeText(deepLink.value)
    showShareHint('Ссылка скопирована')
  } catch {
    showShareHint('Скопируйте ссылку: ' + deepLink.value)
  }
  showShareModal.value = false
}

async function openTelegramShare() {
  if (!deepLink.value) return
  const url = `https://telegram.me/share/url?url=${encodeURIComponent(
    deepLink.value,
  )}&text=${encodeURIComponent(good.value?.good.name || 'Товар')}`

  try {
    if ((WebApp as any)?.openTelegramLink) {
      ; (WebApp as any).openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  } finally {
    showShareModal.value = false
  }
}

async function openWhatsAppShare() {
  if (!deepLink.value) return
  const text = encodeURIComponent(
    `${good.value?.good.name || 'Товар'}\n${deepLink.value}`,
  )
  const url = `https://wa.me/?text=${text}`

  try {
    window.open(url, '_blank')
  } finally {
    showShareModal.value = false
  }
}

async function shareProduct() {
  const title = good.value?.good.name || 'Товар'

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: title, url: deepLink.value })
      showShareHint('Ссылка отправлена')
      return
    } catch (e: any) {
      if (e?.name === 'AbortError') return
    }
  }

  showShareModal.value = true
}

type DescriptionPart = {
  type: 'text' | 'link' | 'br'
  content?: string
}

const descriptionParts = computed<DescriptionPart[]>(() => {
  const desc = good.value?.good.description || ''
  if (!desc) return []

  const lines = desc.split(/\r?\n/)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const result: DescriptionPart[] = []

  lines.forEach((line, lineIdx) => {
    let lastIndex = 0

    line.replace(urlRegex, (match, _p1, offset) => {
      if (offset > lastIndex) {
        result.push({
          type: 'text',
          content: line.slice(lastIndex, offset),
        })
      }

      result.push({
        type: 'link',
        content: match,
      })

      lastIndex = offset + match.length
      return match
    })

    if (lastIndex < line.length) {
      result.push({
        type: 'text',
        content: line.slice(lastIndex),
      })
    }

    if (lineIdx < lines.length - 1) {
      result.push({ type: 'br' })
    }
  })

  return result
})

/* Загрузка данных и сброс предыдущего товара */
async function loadCurrentGood() {
  const id = Number(route.params.id)
  if (isNaN(id)) return

  good.value = null
  selectedIndex.value = 0

  await store.loadGood(id)
}

onMounted(() => {
  loadCurrentGood()
})

watch(
  () => route.params.id,
  () => {
    loadCurrentGood()
  },
)

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
    return isInt ? `${n} TJS` : `${n.toFixed(2)} TJS`
  }
}

function valueToText(v: StockNS.PropertyValue): string {
  switch (v.type) {
    case 'StringValue':
      return String(v.value)
    case 'NumberValue':
      return String(v.value)
    case 'IntValue':
      return String(v.value)
    case 'BooleanValue':
      return v.value ? 'Да' : 'Нет'
    default:
      return ''
  }
}
function variantLabel(s: Stock): string {
  const props = Array.isArray(s.goodProperties) ? s.goodProperties : []
  if (!props.length) return s.overriddenName || 'Вариант'
  return [...props]
    .sort((a, b) => a.propertyName.localeCompare(b.propertyName, 'ru'))
    .map((p) => `${p.propertyName}: ${valueToText(p.value)}`)
    .join(', ')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
