import { defineStore } from 'pinia'
import type { GoodWithStock } from '@/types/models'

export const useSearchStore = defineStore('search', {
  state: () => ({
    q: '' as string,                // введённый текст
    results: [] as GoodWithStock[], // последние найденные товары
    sessionId: null as string | null, // последний sid (идентификатор «сеанса» поиска)
  }),
  actions: {
    setQuery(q: string) {
      this.q = q
    },
    setResults(list: GoodWithStock[]) {
      this.results = list
    },
    setSession(id: string | null) {
      this.sessionId = id
    },
    clearAll() {
      this.q = ''
      this.results = []
    },
  },
})
