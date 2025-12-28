import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGoods, fetchGoodById } from '@/api/goods'
import type { GoodWithStock } from '@/types/models'

export const useGoodsStore = defineStore('goods', () => {
  const goods = ref<GoodWithStock[]>([])
  const good = ref<GoodWithStock | null>(null)
  const loading = ref(false)

  const limit = 20
  const offset = ref(0)
  const hasMore = ref(true)
  const loadingMore = ref(false)
  let lastCategoryId: number | undefined
  const isInitialLoaded = ref(false)

  const loadGoods = async (categoryId?: number) => {
    // смена категории → полный сброс
    if (lastCategoryId !== categoryId) {
      goods.value = []
      offset.value = 0
      hasMore.value = true
      lastCategoryId = categoryId
    }

    if (!hasMore.value || loadingMore.value) return

    loadingMore.value = true
    loading.value = offset.value === 0

    let ok = false
    try {
      const data = await fetchGoods({
        categoryId,
        offset: offset.value,
        limit
      })
      ok = true

      if (data.length < limit) {
        hasMore.value = false
      }

      goods.value.push(...data)
      offset.value += data.length
    } finally {
      loading.value = false
      loadingMore.value = false
    }

    if (ok && !isInitialLoaded.value) isInitialLoaded.value = true

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
    hasMore,
    loadingMore,
    isInitialLoaded,
  }
})
