export interface ProductStockNetworkModel {
  id: number
  product: {
    id: number
    name: string
    categoryId: number
    country: string
    defaultImages: string[]
  }
  overriddenName: string
  count: number
  unitPrice: number
  webPrice: number | null
  barcode: string
  sku: string
  updatedAt: number
  images: string[]
  properties: Record<string, string>
}
