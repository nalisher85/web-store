<template>
  <div class="p-4 max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-center">Мои заказы</h1>

    <!-- Фильтр -->
    <div class="flex justify-center gap-2 mb-4 flex-wrap">
      <button v-for="opt in filterOptions" :key="opt.value" @click="selectedFilter = opt.value" :class="[
        'text-sm px-3 py-1 rounded-full border transition',
        selectedFilter === opt.value
          ? 'bg-blue-100 text-blue-700 border-blue-500'
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      ]">
        {{ opt.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center text-gray-500">Загрузка заказов...</div>
    <div v-else-if="error" class="text-center text-red-500">Ошибка: {{ error }}</div>
    <div v-else-if="filteredOrders.length === 0" class="text-center text-gray-400">Нет заказов</div>

    <div v-else class="space-y-4">
      <div v-for="order in filteredOrders" :key="order.id" class="border rounded-xl p-4 shadow-sm bg-white space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">
            Заказ №{{ order.id }} от {{ formatDateTime(order.createdAt) }}
          </span>

          <span class="text-[11px] leading-none px-2 py-1 rounded-full max-w-[96px] truncate text-center"
            :class="statusClass(order.orderStatus)">
            {{ getStatusLabel(order.orderStatus) }}
          </span>
        </div>

        <div class="divide-y">
          <div v-for="item in order.orderDetails" :key="item.barcode" class="py-1">
            <div class="flex justify-between text-sm">
              <span>
                {{ item.productName }} × {{ formatQuantity(item) }}
              </span>
              <span>{{ fmtTJS((Number(item.price) || 0) * (Number(item.orderCount) || 0)) }}</span>
            </div>
            <div v-if="item.productProperties" class="text-xs text-gray-500 mt-0.5">
              {{ item.productProperties }}
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 font-semibold">
          <span>Итого:</span>
          <span>{{ fmtTJS(getTotal(order)) }}</span>
        </div>

        <button v-if="order.orderStatus === 'NEW' && order.id !== undefined" @click="confirmCancel(order.id)"
          class="text-sm text-red-600 underline">
          Отменить заказ
        </button>
      </div>
    </div>

    <!-- Диалог отмены -->
    <div v-if="cancelDialogId !== null" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full space-y-4">
        <h2 class="text-lg font-semibold">Отменить заказ?</h2>
        <p class="text-sm text-gray-600">Вы уверены, что хотите отменить заказ №{{ cancelDialogId }}?</p>
        <div class="flex justify-end gap-2">
          <button @click="cancelDialogId = null" class="text-sm px-3 py-1 border rounded">
            Отмена
          </button>
          <button @click="handleCancel(cancelDialogId!)"
            class="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
            Да, отменить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderStatus, OrderDetail } from '@/types/order'
import { useBackButton } from "@/composables/useBackButton"

useBackButton()

// формат суммы в TJS
const fmtTJS = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'TJS', maximumFractionDigits: 0 }).format(n)

// 🔧 Фильтрация
type FilterOption = { value: OrderStatus | 'ALL'; label: string }
const filterOptions: FilterOption[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'NEW', label: 'Новые' },
  { value: 'IN_PROGRESS', label: 'В обработке' },
  { value: 'DONE', label: 'Завершённые' },
  { value: 'CANCELED', label: 'Отменённые' },
]
const selectedFilter = ref<FilterOption['value']>('ALL')

const orderStore = useOrderStore()
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const cancelDialogId = ref<number | null>(null)

const fetch = async () => {
  try {
    loading.value = true
    orders.value = await orderStore.fetchOrders()
  } catch (e: any) {
    error.value = e.message || 'Не удалось загрузить заказы'
  } finally {
    loading.value = false
  }
}

const handleCancel = async (orderId: number) => {
  try {
    await orderStore.cancelOrder(orderId)
    cancelDialogId.value = null
    await fetch()
  } catch (e: any) {
    alert(e.message || 'Ошибка при отмене заказа')
  }
}

const confirmCancel = (orderId: number) => {
  cancelDialogId.value = orderId
}

const formatDateTime = (ts: number) => {
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${yyyy} г. в ${hh}:${mi}`
}

const getTotal = (order: Order) =>
  order.orderDetails.reduce(
    (sum, d) => sum + (Number(d.price) || 0) * (Number(d.orderCount) || 0),
    0
  )

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'NEW': return 'Новый'
    case 'IN_PROGRESS': return 'В обработке'
    case 'DONE': return 'Завершён'
    case 'CANCELED': return 'Отменён'
    default: return status
  }
}

const statusClass = (status: string) => {
  return {
    NEW: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELED: 'bg-gray-200 text-gray-500',
  }[status] || 'bg-gray-100 text-gray-700'
}

const filteredOrders = computed(() => {
  if (selectedFilter.value === 'ALL') return orders.value
  return orders.value.filter(o => o.orderStatus === selectedFilter.value)
})

const formatQuantity = (item: OrderDetail): string => {
  const { orderCount, packedCount, purchasedCount } = item
  const parts: string[] = [`${orderCount}`]
  if (packedCount !== null && packedCount !== orderCount) parts.push(`${packedCount} уп.`)
  if (purchasedCount !== null && purchasedCount !== orderCount) parts.push(`${purchasedCount} куп.`)
  return parts.join(' / ')
}

onMounted(fetch)
</script>