<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Избранное</h1>

    <div v-if="favoriteGoods.length === 0" class="text-gray-500">
      Вы пока ничего не добавили в избранное
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <GoodCard v-for="g in favoriteGoods" :key="g.good.id" :good="g" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGoodsStore } from '@/stores/goodsStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { computed } from 'vue'
import GoodCard from '@/components/GoodCard.vue'
import { useBackButton } from "@/composables/useBackButton";

useBackButton();

const goodsStore = useGoodsStore()
const favorites = useFavoritesStore()

const favoriteGoods = computed(() =>
  goodsStore.goods.filter((g) => favorites.isFavorite(g.good.id))
)
</script>
