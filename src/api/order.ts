import { api } from './axios'

export const createOrder = (payload: any) => {
  return api.post('/telegram/order', payload)
}

export const getOrders = () => {
  return api.get('/telegram/orders')
}

export const cancelOrder = (orderId: number) => {
  return api.post(`/telegram/order/${orderId}/cancel`)
}
