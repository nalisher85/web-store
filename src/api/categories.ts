import { api } from '@/api/axios'
import type { CategoryDataModel } from '@/types/models'


export const fetchCategories = async (): Promise<CategoryDataModel[]> => {
  const response = await api.get(`/telegram/categories`)
  return response.data.data ?? []
}