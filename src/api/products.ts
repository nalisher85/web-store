// src/api/products.ts
import { api } from './axios'
import type { Stock } from '@/types/models' 


export interface StockItem {
  barcode: string
  name: string
  price: number
  imageUrl?: string
  country?: string
}

export async function fetchStockItemsByBarcodes(barcodes: string[]): Promise<Stock[]> {
  const response = await api.get('/telegram/goods/by-barcodes', {
    params: { barcodes: barcodes.join(',') },
  })
  return response.data.data as Stock[]
}
