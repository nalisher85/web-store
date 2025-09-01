<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOrderStore } from '@/stores/orderStore'
import { computed } from 'vue'
import type { OrderDetail } from '@/types/order'
import { RouterLink } from 'vue-router'
import { useBackButton } from "@/composables/useBackButton";

useBackButton();

const orderStore = useOrderStore()
const { result, lastOrder } = storeToRefs(orderStore)

const order = computed(() => lastOrder.value)

const total = computed(() =>
  order.value?.orderDetails.reduce(
    (sum: number, item: OrderDetail) => sum + item.price * item.orderCount,
    0
  ) ?? 0
)
</script>

<template>
  <div class="max-w-xl mx-auto p-6 text-center">
    <template v-if="result?.success">
      <h1 class="text-2xl font-bold mb-2">🎉 Спасибо за заказ!</h1>
      <p class="text-gray-600 mb-4">Мы скоро свяжемся с вами для подтверждения.</p>

      <div class="text-left border rounded p-4 mb-4 bg-gray-50">
        <div><strong>Имя:</strong> {{ order?.name }}</div>
        <div><strong>Телефон:</strong> {{ order?.phone }}</div>
        <div><strong>Адрес:</strong> {{ order?.address }}</div>
        <div><strong>Описание адреса:</strong> {{ order?.addressDescr || '—' }}</div>
        <div><strong>Комментарий:</strong> {{ order?.extraInfo || '—' }}</div>
      </div>

      <h2 class="font-semibold mb-2 text-left">📦 Товары:</h2>
      <ul class="text-left text-sm border rounded p-4 bg-white mb-4">
        <li v-for="(item, index) in order?.orderDetails" :key="index" class="mb-2">
          <span class="font-medium">{{ item.productName }}</span> —
          {{ item.orderCount }} шт × {{ item.price }} ₽ =
          <span class="text-green-600 font-semibold">{{ item.orderCount * item.price }} ₽</span>
        </li>
      </ul>

      <div class="text-right text-lg font-bold">
        Итого: {{ total }} ₽
      </div>

      <!-- Стиль кнопки при успехе -->
      <router-link to="/"
        class="inline-block mt-6 px-6 py-3 rounded bg-indigo-600 !text-white font-semibold shadow hover:bg-indigo-700 transition">
        Вернуться в каталог
      </router-link>
    </template>

    <template v-else>
      <h1 class="text-2xl font-bold text-red-600 mb-2">❌ Ошибка оформления заказа</h1>
      <p class="text-gray-600 mb-4">Попробуйте позже</p>
      <p class="text-red-500">{{ result?.error }}</p>

      <!-- Стиль кнопки при ошибке -->
      <router-link to="/"
        class="inline-block mt-6 px-6 py-3 rounded bg-gray-200 text-black font-semibold hover:bg-gray-300 transition">
        Вернуться в каталог
      </router-link>
    </template>

    <RouterLink v-if="orderStore.result?.success" to="/orders"
      class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
      Перейти к заказам
    </RouterLink>

  </div>
</template>
