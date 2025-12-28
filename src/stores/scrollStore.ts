import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScrollStore = defineStore('scroll', () => {
  const positions = ref<Record<string, number>>({})

  function save(key: string, y: number) {
    positions.value[key] = y
  }

  function get(key: string): number {
    return positions.value[key] ?? 0
  }

  return { save, get }
})
