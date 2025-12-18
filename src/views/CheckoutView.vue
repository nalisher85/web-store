<template>
  <div class="mx-auto max-w-xl min-h-[100dvh] flex flex-col bg-white">
    <header class="px-4 pt-6 pb-2">
      <h1 class="text-2xl font-bold">Оформление заказа</h1>
    </header>

    <!-- Скролл-область. Отступ снизу растёт, когда появляется клавиатура -->
    <div
      ref="scrollEl"
      class="flex-1 overflow-y-auto px-4"
      :style="{ paddingBottom: `calc(${kb}px + env(safe-area-inset-bottom) + 24px)` }"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
        <div>
          <label class="block font-semibold mb-1">Имя</label>
          <input v-model.trim="name" type="text"
                 :aria-invalid="attempted && !validName"
                 class="w-full border rounded px-3 py-2 field"
                 :class="attempted && !validName ? 'border-red-500' : ''"
                 autocomplete="name" @focus="ensureVisible" />
        </div>

        <div>
          <label class="block font-semibold mb-1">Телефон</label>
          <input v-model.trim="phone" type="tel" inputmode="tel"
                 :aria-invalid="attempted && !validPhone"
                 class="w-full border rounded px-3 py-2 field"
                 :class="attempted && !validPhone ? 'border-red-500' : ''"
                 autocomplete="tel" @focus="ensureVisible" />
          <p v-if="attempted && !validPhone" class="text-xs text-red-500 mt-1">Введите корректный номер телефона</p>
        </div>

        <div>
          <label class="block font-semibold mb-1">Адрес доставки</label>
          <input v-model.trim="address" type="text"
                 :aria-invalid="attempted && !validAddress"
                 class="w-full border rounded px-3 py-2 field"
                 :class="attempted && !validAddress ? 'border-red-500' : ''"
                 autocomplete="street-address" @focus="ensureVisible" />
        </div>

        <div>
          <label class="block font-semibold mb-1">Описание адреса</label>
          <input v-model.trim="addressDescr" type="text" placeholder="Подъезд, этаж, ориентир и т.п."
                 class="w-full border rounded px-3 py-2 field"
                 @focus="ensureVisible" />
        </div>

        <div>
          <label class="block font-semibold mb-1">Дополнительная информация</label>
          <textarea v-model.trim="extraInfo" rows="3"
                    class="w-full border rounded px-3 py-2 field"
                    @focus="ensureVisible"></textarea>
        </div>

        <p v-if="errorMessage" class="text-red-500 font-medium">
          {{ errorMessage }}
        </p>

        <!-- Фолбэк-кнопка: показываем ТОЛЬКО если системная MainButton не активна -->
        <button
          v-if="!isMainButtonActive"
          class="w-full h-12 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading || !formValid"
          type="submit"
        >
          {{ loading ? 'Отправка...' : 'Подтвердить заказ' }}
        </button>

        <div class="h-6"></div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useGoodsStore } from '@/stores/goodsStore'
import { useOrderStore } from '@/stores/orderStore'
import { OrderStatus } from '@/types/order'
import { useBackButton } from "@/composables/useBackButton"
import { useMainButton } from "@/composables/useMainButton"
import type { StockNS } from '@/types/models'

useBackButton()

function valueToText(v: StockNS.PropertyValue): string {
  switch (v.type) {
    case 'StringValue': return String(v.value)
    case 'NumberValue': return String(v.value)
    case 'IntValue': return String(v.value)
    case 'BooleanValue': return v.value ? 'Да' : 'Нет'
    default: return ''
  }
}

function propsToString(props: StockNS.Property[] | undefined): string {
  const list = props ?? []
  if (!list.length) return ''
  return [...list]
    .sort((a, b) => a.propertyName.localeCompare(b.propertyName, 'ru'))
    .map(p => `${p.propertyName}: ${valueToText(p.value as any)}`)
    .join(', ')
}

const name = ref(''); const phone = ref(''); const address = ref('')
const addressDescr = ref(''); const extraInfo = ref(''); const errorMessage = ref('')
const loading = ref(false)
const attempted = ref(false)

const cartStore = useCartStore()
const goodsStore = useGoodsStore()
const orderStore = useOrderStore()
const router = useRouter()

/** Всегда подтягиваем фактические цены/названия из корзины */
onMounted(() => {
  cartStore.syncStockDetails()
})

/** Позиции заказа: приоритет — данные корзины (надёжные), потом goodsStore */
const items = computed(() =>
  cartStore.items.map(ci => {
    const fromCart = cartStore.stockItemsMap[ci.barcode]
    const fromGoods = goodsStore.allGoods.find(g => g.stock.some(s => s.barcode === ci.barcode))
    const fromGoodsStock = fromGoods?.stock.find(s => s.barcode === ci.barcode)
    const goodId = fromGoods?.good.id ?? null

    console.log('myLog computed')
    console.log('[cart] items:', cartStore.items)
    console.log('[cart] map:', toRaw(cartStore.stockItemsMap))           // снять Proxy
    console.table(Object.values(toRaw(cartStore.stockItemsMap) ?? {}))   // табличкой

    const name = fromCart?.name ?? fromGoods?.good.name ?? 'Товар'
    const price = (fromCart?.price ?? fromGoodsStock?.webPrice ?? 0)

    return {
      productName: name,
      productProperties: propsToString(fromGoodsStock?.goodProperties),
      price,
      orderCount: ci.count,
      packedCount: 0,
      purchasedCount: 0,
      barcode: ci.barcode,
      goodId: goodId,
    }
  })
)

/* ==== ЯВНАЯ ВАЛИДАЦИЯ ==== */
const validName = computed(() => name.value.trim().length >= 2)
const phoneDigits = computed(() => phone.value.replace(/\D/g, ''))
const validPhone = computed(() => phoneDigits.value.length >= 7 && phoneDigits.value.length <= 15)
const validAddress = computed(() => address.value.trim().length >= 5)
const hasItems = computed(() => items.value.length > 0)

const formValid = computed(() =>
  validName.value && validPhone.value && validAddress.value && hasItems.value && !loading.value
)

const handleSubmit = async () => {
  attempted.value = true
  errorMessage.value = ''

  if (loading.value || !formValid.value) {
    if (!hasItems.value) {
      errorMessage.value = 'Добавьте товары в корзину'
    } else if (!validName.value) {
      errorMessage.value = 'Укажите имя'
    } else if (!validPhone.value) {
      errorMessage.value = 'Введите корректный номер телефона'
    } else if (!validAddress.value) {
      errorMessage.value = 'Укажите адрес доставки'
    }
    return
  }

  loading.value = true

  const payload = {
    name: name.value.trim(),
    phone: phoneDigits.value,
    address: address.value.trim(),
    addressDescr: addressDescr.value.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    extraInfo: extraInfo.value.trim(),
    orderStatus: OrderStatus.NEW,
    orderDetails: items.value,
  }

  await orderStore.submitOrder(payload)
  if (orderStore.result?.success) {
    orderStore.setLastOrder(payload); cartStore.clear(); void router.push('/order-confirmation')
  } else {
    errorMessage.value = orderStore.result?.error ?? 'Произошла ошибка при оформлении заказа.'
  }
  loading.value = false
}

/* === MainButton: "Подтвердить заказ" === */
const { isMainButtonActive, setEnabled, setLoading } = useMainButton({
  text: "Подтвердить заказ",
  onClick: handleSubmit,
})

watch(formValid, (ok) => setEnabled(!!ok), { immediate: true })
watch(loading, (v) => setLoading(!!v), { immediate: true })

/* === Безопасная работа с клавиатурой === */
const kb = ref(0)
let vv: VisualViewport | undefined
let baseH: number | undefined

const onVV = () => {
  if (!vv) return
  if (baseH == null) baseH = vv.height
  const diff = Math.max(0, (baseH ?? vv.height) - vv.height)
  kb.value = Math.round(diff)
}
onMounted(() => {
  vv = window.visualViewport as any
  if (vv) {
    baseH = vv.height
    ;['resize','scroll'].forEach(e => vv!.addEventListener(e, onVV))
  } else {
    window.addEventListener('focusin', () => (kb.value = 320))
    window.addEventListener('focusout', () => (kb.value = 0))
  }
})

onBeforeUnmount(() => {
  if (vv) ['resize','scroll'].forEach(e => vv!.removeEventListener(e, onVV))
  else {
    window.removeEventListener('focusin', () => (kb.value = 320))
    window.removeEventListener('focusout', () => (kb.value = 0))
  }
})

/* При фокусе прокручиваем поле в зону «над клавиатурой» */
const scrollEl = ref<HTMLElement | null>(null)
const ensureVisible = async (e: FocusEvent) => {
  const el = e.target as HTMLElement | null
  await nextTick()
  if (!el || !scrollEl.value) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
</script>

<style scoped>
/* небольшой запас, чтобы поле после scrollIntoView не упиралось в края */
.field { scroll-margin: 80px 0; }
</style>