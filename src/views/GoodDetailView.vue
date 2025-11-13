<template>
  <div class="p-6 max-w-xl mx-auto">
    <!-- Название, страна -->
    <h1 class="text-2xl font-bold mb-1">{{ good?.good.name }}</h1>
    <p class="text-gray-500 mb-4">{{ good?.good.country }}</p>

    <!-- Галерея -->
    <ImageGallery :key="galleryKey" :images="galleryImages" />

    <!-- Цена + кнопки (адаптивно, с переносом) -->
    <div class="my-4">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Цена слева, занимает доступное место -->
        <div class="text-green-600 font-bold text-xl mr-auto">
          <span v-if="selectedStock">
            {{ formatPrice(selectedStock.webPrice ?? 0) }}
          </span>
          <span v-else class="text-gray-400">Цена не указана</span>
        </div>

        <!-- Группа кнопок: переносится на новую строку при узком экране -->
        <div class="flex gap-2 w-full sm:w-auto justify-end">
          <button @click="toggleFavorite"
            class="px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-gray-50 active:translate-y-px">
            {{ isFavorite ? 'В избранном ❤️' : 'В избранное 🤍' }}
          </button>

          <button @click="shareProduct"
            class="px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-gray-50 active:translate-y-px disabled:opacity-50"
            :disabled="!deepLink" aria-label="Поделиться товаром">
            Поделиться
          </button>
        </div>
      </div>

      <!-- Короткая подсказка после шаринга -->
      <p v-if="shareHint" class="text-xs text-gray-500 mt-1 text-right">
        {{ shareHint }}
      </p>
    </div>

    <!-- Модификации -->
    <section v-if="hasMoreThenOne" class="mb-4">
      <h2 class="font-semibold text-lg mb-2">Модификации</h2>

      <div class="flex flex-wrap gap-2">
        <button v-for="(s, idx) in good!.stock" :key="s.barcode || idx" type="button" @click="selectVariant(idx)"
          class="rounded-full border max-w-full transition hover:bg-gray-50" :class="idx === selectedIndex
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-800 border-gray-200'" aria-label="Выбрать модификацию">
          <!-- ЗАДАЁМ ЖЁСТКИЕ ОТСТУПЫ ВНУТРИ ЧИПСЫ -->
          <div class="flex items-center w-full gap-3 py-3 pl-6 pr-5">
            <!-- Текст варианта -->
            <span class="flex-1 min-w-0 break-words leading-normal text-left">
              {{ variantLabel(s) }}
            </span>
            <!-- Цена -->
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

    <!-- Модалка «Поделиться» (Android / без navigator.share) -->
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
import { useMainButton } from '@/composables/useMainButton'
import WebApp from '@twa-dev/sdk'
import { BOT_USERNAME } from '@/config'

useBackButton()

const route = useRoute()
const store = useGoodsStore()
const { good } = storeToRefs(store)
const cart = useCartStore()
const favorites = useFavoritesStore()

/* Галерея */
const selectedIndex = ref<number>(0)
const galleryImages = computed(() => {
  const stockImgs = selectedStock.value?.images ?? []
  return stockImgs.length ? stockImgs : (good.value?.good.defaultImages ?? [])
})
const galleryKey = computed(() => `${good.value?.good.id ?? 'x'}-${selectedIndex.value}`)

/* Варианты */
const hasVariants = computed(() => Array.isArray(good.value?.stock) && good.value!.stock.length > 0)
const hasMoreThenOne = computed(() => Array.isArray(good.value?.stock) && good.value!.stock.length > 1)
const selectedStock = computed<Stock | null>(() => {
  if (!hasVariants.value) return null
  const idx = Math.min(selectedIndex.value, good.value!.stock.length - 1)
  return good.value!.stock[idx] ?? null
})
const selectedProps = computed(() =>
  [...(selectedStock.value?.goodProperties ?? [])].sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, 'ru'),
  ),
)
function selectVariant(idx: number) { selectedIndex.value = idx }

/* Избранное */
const isFavorite = computed(() => good.value?.good.id ? favorites.isFavorite(good.value.good.id) : false)
const toggleFavorite = () => { if (good.value?.good.id) favorites.toggleFavorite(good.value.good.id) }

/* Корзина */
const canAddToCart = computed(() => {
  const s = selectedStock.value
  return Boolean(s?.barcode) && typeof s?.webPrice === 'number'
})

function handleAddToCart() {
  const s = selectedStock.value
  if (!s?.barcode) return
  cart.addToCart(s.barcode)

  // лёгкая вибрация в Telegram
  try { WebApp.HapticFeedback?.notificationOccurred?.('success') } catch { }

  // снек
  showSnack('Добавлено в корзину')

  // кратко меняем текст у MainButton (вернём через 1.2s)
  try {
    setText('✓ Добавлено')
    setTimeout(() => setText('В корзину'), 1200)
  } catch { }
}

const snackVisible = ref(false)
const snackText = ref('')
let snackTimer: number | undefined

function showSnack(msg: string) {
  snackText.value = msg
  snackVisible.value = true
  if (snackTimer) clearTimeout(snackTimer as any)
  // @ts-ignore
  snackTimer = setTimeout(() => { snackVisible.value = false }, 1400)
}

/* MainButton */
const { isMainButtonActive, setEnabled, setText } = useMainButton({ text: 'В корзину', onClick: handleAddToCart })
watch(canAddToCart, (ok) => setEnabled(!!ok), { immediate: true })
watch(selectedStock, (s) => setText(s?.webPrice != null ? `В корзину · ${formatPrice(s.webPrice)}` : 'В корзину'), { immediate: true })

/* Deep-link + Share */
const deepLink = computed(() => good.value?.good.id ? `https://t.me/${BOT_USERNAME}?start=good_${good.value.good.id}` : '')
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
  const url = `https://t.me/share/url?url=${encodeURIComponent(deepLink.value)}&text=${encodeURIComponent(good.value?.good.name || 'Товар')}`

  try {
    if ((WebApp as any)?.openTelegramLink) {
      (WebApp as any).openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  } finally {
    showShareModal.value = false
  }
}

async function openWhatsAppShare() {
  if (!deepLink.value) return
  const text = encodeURIComponent(`${good.value?.good.name || 'Товар'}\n${deepLink.value}`)
  const url = `https://wa.me/?text=${text}`

  try {
    window.open(url, '_blank')
  } finally {
    showShareModal.value = false
  }
}

async function shareProduct() {
  const title = good.value?.good.name || 'Товар'

  // iOS / современные браузеры: системное окно «Поделиться»
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: title, url: deepLink.value })
      showShareHint('Ссылка отправлена')
      return
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      // не удалось — упадём в модалку
    }
  }

  // Android / без Web Share API: наша модалка
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

    // ищем ссылки в строке
    line.replace(urlRegex, (match, _p1, offset) => {
      // текст до ссылки
      if (offset > lastIndex) {
        result.push({
          type: 'text',
          content: line.slice(lastIndex, offset),
        })
      }

      // сама ссылка
      result.push({
        type: 'link',
        content: match,
      })

      lastIndex = offset + match.length
      return match
    })

    // хвост строки после последней ссылки
    if (lastIndex < line.length) {
      result.push({
        type: 'text',
        content: line.slice(lastIndex),
      })
    }

    // перевод строки (кроме последней строки)
    if (lineIdx < lines.length - 1) {
      result.push({ type: 'br' })
    }
  })

  return result
})


/* Данные */
onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) { await store.loadGood(id); selectedIndex.value = 0 }
})

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

function valueToText(v: StockNS.PropertyValue): string {
  switch (v.type) {
    case 'StringValue': return String(v.value)
    case 'NumberValue': return String(v.value)
    case 'IntValue': return String(v.value)
    case 'BooleanValue': return v.value ? 'Да' : 'Нет'
    default: return ''
  }
}
function variantLabel(s: Stock): string {
  const props = Array.isArray(s.goodProperties) ? s.goodProperties : []
  if (!props.length) return s.overriddenName || 'Вариант'
  return [...props]
    .sort((a, b) => a.propertyName.localeCompare(b.propertyName, 'ru'))
    .map(p => `${p.propertyName}: ${valueToText(p.value)}`)
    .join(', ')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>