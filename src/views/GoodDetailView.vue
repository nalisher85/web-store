<template>
  <div class="p-6 max-w-xl mx-auto">

    <h1 class="text-2xl font-bold mb-1">{{ good?.good.name }}</h1>
    <p class="text-gray-500 mb-4">{{ good?.good.country }}</p>

    <ImageGallery :images="good?.good.defaultImages || []" />

    <div class="text-green-600 font-bold text-xl my-4">
      {{ hasPrice ? good?.stock?.[0]?.webPrice + ' ₽' : 'Цена не указана' }}
    </div>

    <div class="flex gap-4">

      <button v-if="!isMainButtonActive" :class="[
        'px-4 py-2 rounded bg-gray-100 transition',
        hasPrice && !isAdded ? 'text-black hover:bg-gray-200 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
      ]" :disabled="!hasPrice || isAdded" @click="handleAddToCart">
        {{ isAdded ? 'Добавлено ✅' : 'В корзину' }}
      </button>

      <button @click="toggleFavorite" class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
        <span v-if="isFavorite">Удалить из избранного ❤️</span>
        <span v-else>Добавить в избранное 🤍</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGoodsStore } from '@/stores/goodsStore'
import ImageGallery from '@/components/ImageGallery.vue'
import { useCartStore } from '@/stores/cartStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useBackButton } from "@/composables/useBackButton";
import { useMainButton } from "@/composables/useMainButton";

useBackButton();

const route = useRoute()
const store = useGoodsStore()
const { good } = storeToRefs(store)
const cart = useCartStore()
const isAdded = ref(false)
const favorites = useFavoritesStore()

const toggleFavorite = () => {
  if (good.value?.good.id) {
    favorites.toggleFavorite(good.value.good.id)
  }
}

const isFavorite = computed(() =>
  good.value?.good.id ? favorites.isFavorite(good.value.good.id) : false
)

const hasPrice = computed(() => {
  const stack = good.value?.stock
  return Array.isArray(stack) && stack.length > 0 && stack[0].webPrice != null
})

const canAddToCart = computed(() => {
  const barcode = good.value?.stock?.[0]?.barcode
  return Boolean(barcode && hasPrice.value)
})

function handleAddToCart() {
  const barcode = good.value?.stock[0]?.barcode
  if (barcode) {
    cart.addToCart(barcode)
    isAdded.value = true
    setTimeout(() => (isAdded.value = false), 1500)
  }
}

// --- MainButton: "В корзину" ---
const { isMainButtonActive, setEnabled } = useMainButton({
  text: "В корзину",
  onClick: handleAddToCart,
})
// включаем/выключаем системную кнопку когда товар (и цена) доступны
watch(canAddToCart, (ok) => setEnabled(!!ok), { immediate: true })

onMounted(() => {
  const id = Number(route.params.id)
  if (!isNaN(id)) store.loadGood(id)
})
</script>
