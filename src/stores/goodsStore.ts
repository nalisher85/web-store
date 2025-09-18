import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGoods, fetchGoodById } from '@/api/goods'
import type { GoodWithStock } from '@/types/models'

export const useGoodsStore = defineStore('goods', () => {
  const goods = ref<GoodWithStock[]>([])
  const good = ref<GoodWithStock | null>(null)
  const loading = ref(false)

  const loadGoods = async (categoryId?: number) => {
    loading.value = true
    goods.value = await fetchGoods(categoryId)
    loading.value = false
  }

    const loadGood = async (id: number) => {
    loading.value = true
    good.value = await fetchGoodById(id)
    loading.value = false
  }

  return {
    goods,
    good,
    loading,
    loadGoods,
    loadGood,
    allGoods: goods,
  }
})
