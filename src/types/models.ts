export interface Stock {
  id: number
  goodId: number
  overriddenName: string
  count: number
  webPrice?: number
  barcode: string
  sku: string
  updatedAt: number
  images: string[]
  properties: Record<string, string>
}

export interface PharmGood {
  id: number
  name: string
  country: string
  manufacturer?: string
  sku?: string
  description?: string
  countInPack: number
  updatedAt: number
  defaultImages: string[]
  certificateUrl?: string
  productForm: string
  measurementUnitInfo: string
  needPrescription?: boolean
  activeIngredients: string[]
  activeIngredientsDosage: string[]
}

export interface GoodWithStack {
  good: PharmGood
  stack: Stock[]
}

export interface CategoryDataModel {
  id: number
  name: string
  parentId: number | null
  updatedAt: number
}
