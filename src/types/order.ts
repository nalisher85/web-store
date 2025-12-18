// src/types/order.ts

export interface OrderDetail {
  id?: number                
  orderId?: number 
  goodId?: number | null
  productName: string
  productProperties: string | null
  price: number
  orderCount: number
  packedCount: number | null
  purchasedCount: number | null
  barcode: string
}

export const OrderStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
} as const

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export interface Order {
  id?: number 
  name: string
  phone: string
  address: string
  addressDescr: string | null
  createdAt: number
  updatedAt: number
  extraInfo: string | null
  orderStatus: OrderStatus
  orderDetails: OrderDetail[]
}
