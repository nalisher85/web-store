// @/stores/orderStore.ts
import { defineStore } from 'pinia'
import { createOrder, getOrders, cancelOrder } from '@/api/order'
import type { Order } from '@/types/order'

interface OrderResult {
  success: boolean
  error?: string
}

export const useOrderStore = defineStore('order', {
  state: () => ({
    result: null as OrderResult | null,
    lastOrder: null as Order | null,
  }),

  actions: {
    async submitOrder(payload: Order) {
      try {
        const response = await createOrder(payload)

        const isSuccess = response.data.statusCode === 200

        this.result = {
          success: isSuccess,
          error: !isSuccess ? response.data.message : undefined,
        }

        if (isSuccess) {
          this.lastOrder = payload
        }
      } catch (err: any) {
        this.result = {
          success: false,
          error: err?.message || 'Неизвестная ошибка',
        }
      }
    },
    async fetchOrders(): Promise<Order[]> {
      const response = await getOrders()
      return response.data.data
    },
    async cancelOrder(orderId: number): Promise<void> {
      await cancelOrder(orderId)
    },
    setLastOrder(payload: Order) {
      this.lastOrder = payload
    },
    reset() {
      this.result = null
      this.lastOrder = null
    },
  },
  persist: true,
})
