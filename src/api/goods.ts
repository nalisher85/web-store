import { api } from '@/api/axios'
import type { GoodWithStock } from '@/types/models'

export const fetchGoods = async (categoryId?: number): Promise<GoodWithStock[]> => {
  const url = categoryId
    ? `/telegram/goods?categoryId=${categoryId}`
    : `/telegram/goods`

  const response = await api.get(url)
  
  const raw: GoodWithStock[] = response.data.data ?? []

    // Модифицируем картинки, чтобы сразу отдавать готовые URL
  raw.forEach(item => {
    item.good.defaultImages = item.good.defaultImages.map(img => img)
    item.stock.forEach(stock => {
      stock.images = stock.images.map(img => img)
    })
  })

  return raw
}

export const fetchGoodById = async (id: number): Promise<GoodWithStock> => {
  const response = await api.get(`/telegram/good/${id}`)
  const good = response.data.data

  good.good.defaultImages = good.good.defaultImages.map((img: string) => img)
  good.stock.forEach((stock: any) => {
    stock.images = stock.images.map((img: string) => img)
  })

  return good
}
