<template>
  <div class="relative">
    <router-link to="/cart" class="text-xl">
      🛒
    </router-link>
    <span
      v-if="cartCount > 0"
      class="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
    >
      {{ cartCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'  

const cartStore = useCartStore()
const { items } = storeToRefs(cartStore)

// 🔁 Считаем общее количество всех товаров (включая повторы)
const cartCount = computed(() =>
  items.value.reduce((total, item) => total + item.count, 0)
)

</script>
