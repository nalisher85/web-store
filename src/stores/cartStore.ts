// @/stores/cartStore.ts
import { defineStore } from 'pinia'
import { fetchStockItemsByBarcodes, type StockItem } from '@/api/products'
import type { ProductStockNetworkModel } from '@/types/product'

export interface CartItem {
    barcode: string
    count: number
}

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [] as CartItem[],
        stockItemsMap: {} as Record<string, StockItem>,
    }),

    actions: {
        async syncStockDetails() {
            const barcodes = this.items.map(i => i.barcode)
            if (!barcodes.length) return

            try {
                const stockItems = await fetchStockItemsByBarcodes(barcodes) as ProductStockNetworkModel[]

                this.stockItemsMap = Object.fromEntries(
                    stockItems.map(item => {

                        const localImage = item.images?.[0]
                        const fallbackImage = item.product?.defaultImages?.[0]
                        const imageFile = localImage || fallbackImage || ''
                        const imageUrl = imageFile ? `${imageFile}` : ''
        
                        return [
                            item.barcode,
                            {
                                barcode: item.barcode,
                                name: item.overriddenName,
                                price: item.webPrice ?? 0,
                                country: item.product?.country ?? '',
                                imageUrl,
                            },
                        ]
                    })
                )
            } catch (error) {
                console.error('Не удалось загрузить детали товаров:', error)
            }
        },

        addToCart(barcode: string) {
            const existing = this.items.find(i => i.barcode === barcode)
            if (existing) {
                existing.count++
            } else {
                this.items.push({ barcode, count: 1 })
            }
            this.syncStockDetails()
        },

        decrement(barcode: string) {
            const item = this.items.find(i => i.barcode === barcode)
            if (item) {
                item.count--
                if (item.count <= 0) {
                    this.remove(barcode)
                }
            }
        },

        remove(barcode: string) {
            this.items = this.items.filter(i => i.barcode !== barcode)
            delete this.stockItemsMap[barcode]
        },

        clear() {
            this.items = []
            this.stockItemsMap = {}
        }
    },

    persist: true,
})
