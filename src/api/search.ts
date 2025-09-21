// src/api/search.ts
import { api } from '@/api/axios'
import type { GoodWithStock } from '@/types/models'

/**
 * GET /telegram/goods/search?query=...
 * Возвращает GoodWithStock[]
 */
export async function searchGoods(query: string, signal?: AbortSignal): Promise<GoodWithStock[]> {
  const q = encodeURIComponent(query)
  // ЯВНО добавляем query в URL (axios точно не потеряет параметр)
  const url = `/telegram/goods/search?query=${q}`

  const resp = await api.get(url, { signal })

  // у тебя бэк отвечает обёрткой { statusCode, status, message, data }
  const list: GoodWithStock[] = Array.isArray(resp.data?.data) ? resp.data.data : []

  // Подклеиваем базу для картинок (как в fetchGoods)
  const addBase = (img: string) => img
  list.forEach(item => {
    item.good.defaultImages = (item.good.defaultImages ?? []).map(addBase)
    item.stock.forEach(stock => {
      stock.images = (stock.images ?? []).map(addBase)
    })
  })

  return list
}
