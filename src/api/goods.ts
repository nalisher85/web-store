import { api } from '@/api/axios'
import type { GoodWithStack } from '@/types/models'
import { IMG_BASE_URL } from '@/config'

export const fetchGoods = async (categoryId?: number): Promise<GoodWithStack[]> => {
  const url = categoryId
    ? `/telegram/goods?categoryId=${categoryId}`
    : `/telegram/goods`

  const response = await api.get(url)
  
  const raw: GoodWithStack[] = response.data.data ?? []

    // Модифицируем картинки, чтобы сразу отдавать готовые URL
  raw.forEach(item => {
    item.good.defaultImages = item.good.defaultImages.map(img => IMG_BASE_URL + img)
    item.stack.forEach(stock => {
      stock.images = stock.images.map(img => IMG_BASE_URL + img)
    })
  })

  return raw
}

export const fetchGoodById = async (id: number): Promise<GoodWithStack> => {
  const response = await api.get(`/telegram/good/${id}`)
  const good = response.data.data

  good.good.defaultImages = good.good.defaultImages.map((img: string) => IMG_BASE_URL + img)
  good.stack.forEach((stock: any) => {
    stock.images = stock.images.map((img: string) => IMG_BASE_URL + img)
  })

  return good
}
