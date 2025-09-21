<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-6 flex items-center gap-4">
      🛒 Корзина
    </h1>

    <div v-if="cartStore.items.length === 0" class="text-center text-gray-500">
      Ваша корзина пуста
    </div>

    <div v-else>
      <div v-for="item in cartStore.items" :key="item.barcode" class="border-b py-4">
        <!-- Ряд 1: картинка + контент -->
        <div class="flex items-start gap-4">
          <!-- КАРТИНКА с фолбэком: stock -> good.defaultImages -> плейсхолдер -->
          <div class="h-14 w-14 flex-shrink-0 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
            <img
              v-if="imageSrc(item.barcode)"
              :src="imageSrc(item.barcode)!"
              alt="Изображение"
              class="h-full w-full object-cover"
              @error="onImgError(item.barcode)"
            />
            <span v-else class="text-gray-400 text-[10px] leading-none text-center select-none">
              Нет фото
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="font-semibold leading-snug break-words">
              {{ cartStore.stockItemsMap[item.barcode]?.name || 'Товар' }}
            </div>

            <!-- страна -->
            <div class="text-sm text-gray-500 break-words">
              {{ cartStore.stockItemsMap[item.barcode]?.country || '' }}
            </div>

            <!-- свойства варианта -->
            <div v-if="variantProps(item.barcode)" class="text-xs text-gray-600 mt-1 break-words">
              {{ variantProps(item.barcode) }}
            </div>

            <div class="text-green-600 font-bold mt-1">
              {{ cartStore.stockItemsMap[item.barcode]?.price || 0 }} ₽
            </div>
          </div>
        </div>

        <!-- Ряд 2: контролы количества и удаление -->
        <div class="mt-3 flex items-center justify-end gap-2">
          <button class="px-3 py-1 bg-gray-100 rounded" @click="cartStore.decrement(item.barcode)">−</button>
          <span class="w-6 text-center">{{ item.count }}</span>
          <button class="px-3 py-1 bg-gray-100 rounded" @click="cartStore.addToCart(item.barcode)">+</button>
          <button class="ml-4 text-red-500 hover:underline" @click="cartStore.remove(item.barcode)">Удалить</button>
        </div>
      </div>

      <div class="text-right mt-6 text-xl font-semibold">
        Итого: {{ totalPrice }} ₽
      </div>

      <!-- Фолбэк-кнопка -->
      <div class="text-right mt-4" v-if="!isMainButtonActive">
        <router-link to="/checkout"
          class="bg-white border border-violet-400 text-violet-500 px-6 py-2 rounded shadow hover:bg-violet-50 transition">
          Оформить заказ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useGoodsStore } from '@/stores/goodsStore'
import type { StockNS } from '@/types/models'
import { useBackButton } from '@/composables/useBackButton'
import { useMainButton } from '@/composables/useMainButton'

useBackButton()

const router = useRouter()
const cartStore = useCartStore()
const goodsStore = useGoodsStore()

onMounted(async () => {
  cartStore.syncStockDetails()
  if (!goodsStore.allGoods.length) {
    try { await goodsStore.loadGoods() } catch {}
  }
  initImageSources()
})

/* ====== ЦЕНА / КНОПКА ====== */
const totalPrice = computed(() =>
  cartStore.items.reduce((sum, item) => {
    const product = cartStore.stockItemsMap[item.barcode]
    return sum + item.count * (product?.price ?? 0)
  }, 0)
)

const hasItems = computed(() => cartStore.items.length > 0)
function goCheckout() { void router.push('/checkout') }

const { isMainButtonActive, setEnabled } = useMainButton({
  text: 'Оформить заказ',
  onClick: goCheckout,
})
watch(hasItems, (ok) => setEnabled(!!ok), { immediate: true })

/* ====== ВАРИАНТ → СВОЙСТВА ====== */
function valueToText(v: StockNS.PropertyValue): string {
  switch (v.type) {
    case 'StringValue': return String(v.value)
    case 'NumberValue': return String(v.value)
    case 'IntValue': return String(v.value)
    case 'BooleanValue': return v.value ? 'Да' : 'Нет'
    default: return ''
  }
}
function variantProps(barcode: string): string {
  const gw = goodsStore.allGoods.find(g => g.stock?.some(s => s.barcode === barcode))
  const stock = gw?.stock?.find(s => s.barcode === barcode)
  const props = stock?.goodProperties ?? []
  if (!props.length) return ''
  return [...props]
    .sort((a, b) => a.propertyName.localeCompare(b.propertyName, 'ru'))
    .map(p => `${p.propertyName}: ${valueToText(p.value as any)}`)
    .join(', ')
}

/* ====== ИЗОБРАЖЕНИЕ: stock -> good -> placeholder ====== */

/** текущее src по штрихкоду (или null — тогда рендерим плейсхолдер) */
const imgSrcByBarcode = reactive<Record<string, string | null>>({})

/** список кандидатов (уникальных) для конкретного товара */
function imageCandidates(barcode: string): string[] {
  const stockUrl = cartStore.stockItemsMap[barcode]?.imageUrl || ''

  // ищем good и первую валидную из defaultImages
  const gw = goodsStore.allGoods.find(g => g.stock?.some(s => s.barcode === barcode))
  const goodUrl = gw?.good?.defaultImages?.[0] || ''

  // приоритет: stock, потом good; фильтруем пустые и дубликаты
  return [stockUrl, goodUrl]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) as string[]
}

function initImageSources() {
  for (const it of cartStore.items) {
    const cands = imageCandidates(it.barcode)
    imgSrcByBarcode[it.barcode] = cands[0] ?? null
  }
}

/** получить текущее src для шаблона */
function imageSrc(barcode: string): string | null {
  // если ключ ещё не инициализирован (например, items поменялись) — инициализируем
  if (!(barcode in imgSrcByBarcode)) {
    const cands = imageCandidates(barcode)
    imgSrcByBarcode[barcode] = cands[0] ?? null
  }
  return imgSrcByBarcode[barcode]
}

/** при ошибке загрузки — переключаемся на следующий кандидат, иначе плейсхолдер */
function onImgError(barcode: string) {
  const cands = imageCandidates(barcode)
  const cur = imgSrcByBarcode[barcode]
  const idx = cands.findIndex(u => u === cur)
  const next = idx >= 0 ? cands[idx + 1] : cands[0]
  imgSrcByBarcode[barcode] = next ?? null
}

/* обновляем источники при изменениях корзины/товаров */
watch(
  () => [cartStore.items.map(i => i.barcode).join(','), goodsStore.allGoods.length, JSON.stringify(cartStore.stockItemsMap)],
  () => initImageSources(),
  { immediate: false }
)
</script>