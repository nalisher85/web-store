// src/api/search.ts
import { api } from '@/api/axios'
import type { GoodWithStack } from '@/types/models'
import { IMG_BASE_URL } from '@/config'

/**
 * Поиск товаров на бэке.
 * Возвращает ту же модель, что и /telegram/goods
 * GET /telegram/goods/search?query=...
 */
export async function searchGoods(query: string, signal?: AbortSignal): Promise<GoodWithStack[]> {
  const response = await api.get('/telegram/goods/search', {
    params: { query },
    signal,
  })

  const raw: GoodWithStack[] = response.data?.data ?? []

  // Подклеиваем абсолютные url картинок — как в fetchGoods
  raw.forEach(item => {
    item.good.defaultImages = item.good.defaultImages.map(img => IMG_BASE_URL + img)
    item.stack.forEach((stock: any) => {
      stock.images = (stock.images ?? []).map((img: string) => IMG_BASE_URL + img)
    })
  })

  return raw
}
