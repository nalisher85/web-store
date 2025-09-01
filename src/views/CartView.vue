<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-6 flex items-center gap-4">
      🛒 Корзина
    </h1>

    <div v-if="cartStore.items.length === 0" class="text-center text-gray-500">
      Ваша корзина пуста
    </div>

    <div v-else>
      <div
        v-for="item in cartStore.items"
        :key="item.barcode"
        class="border-b py-4"
      >
        <!-- Ряд 1: картинка + контент (имя, страна, цена) -->
        <div class="flex items-start gap-4">
          <img
            :src="cartStore.stockItemsMap[item.barcode]?.imageUrl || 'https://via.placeholder.com/50x50?text=Нет+фото'"
            alt="Изображение"
            class="w-14 h-14 object-cover border rounded shrink-0"
          />
          <div class="flex-1 min-w-0">
            <!-- НАЗВАНИЕ: без троеточий, перенос по словам -->
            <div class="font-semibold leading-snug break-words">
              {{ cartStore.stockItemsMap[item.barcode]?.name || 'Товар' }}
            </div>
            <div class="text-sm text-gray-500 break-words">
              {{ cartStore.stockItemsMap[item.barcode]?.country || '' }}
            </div>
            <div class="text-green-600 font-bold mt-1">
              {{ cartStore.stockItemsMap[item.barcode]?.price || 0 }} ₽
            </div>
          </div>
        </div>

        <!-- Ряд 2: контролы количества и удаление -->
        <div class="mt-3 flex items-center justify-end gap-2">
          <button
            class="px-3 py-1 bg-gray-100 rounded"
            @click="cartStore.decrement(item.barcode)"
          >
            −
          </button>
          <span class="w-6 text-center">{{ item.count }}</span>
          <button
            class="px-3 py-1 bg-gray-100 rounded"
            @click="cartStore.addToCart(item.barcode)"
          >
            +
          </button>
          <button
            class="ml-4 text-red-500 hover:underline"
            @click="cartStore.remove(item.barcode)"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="text-right mt-6 text-xl font-semibold">
        Итого: {{ totalPrice }} ₽
      </div>

      <!-- Старая кнопка оформления — показываем, если системная MainButton скрыта -->
      <div class="text-right mt-4" v-if="!isMainButtonActive">
        <router-link
          to="/checkout"
          class="bg-white border border-violet-400 text-violet-500 px-6 py-2 rounded shadow hover:bg-violet-50 transition"
        >
          Оформить заказ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useBackButton } from "@/composables/useBackButton"
import { useMainButton } from "@/composables/useMainButton"

useBackButton()

const router = useRouter()
const cartStore = useCartStore()

onMounted(() => {
  cartStore.syncStockDetails()
})

const totalPrice = computed(() =>
  cartStore.items.reduce((sum, item) => {
    const product = cartStore.stockItemsMap[item.barcode]
    return sum + item.count * (product?.price ?? 0)
  }, 0)
)

const hasItems = computed(() => cartStore.items.length > 0)

function goCheckout() {
  void router.push('/checkout')
}

const { isMainButtonActive, setEnabled } = useMainButton({
  text: "Оформить заказ",
  onClick: goCheckout,
})

watch(hasItems, (ok) => setEnabled(!!ok), { immediate: true })
</script>