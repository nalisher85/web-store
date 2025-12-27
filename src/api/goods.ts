import { api } from '@/api/axios'
import type { GoodWithStock } from '@/types/models'

export const fetchGoods = async (
  params?: {
    categoryId?: number
    offset?: number
    limit?: number
  }
): Promise<GoodWithStock[]> => {
  const query = new URLSearchParams()

  if (params?.categoryId) query.append('categoryId', String(params.categoryId))
  if (params?.offset != null) query.append('offset', String(params.offset))
  if (params?.limit != null) query.append('limit', String(params.limit))

  const url = `/telegram/goods${query.toString() ? `?${query}` : ''}`

  const response = await api.get(url)
  const raw: GoodWithStock[] = response.data.data ?? []

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
