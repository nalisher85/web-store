import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const favoriteIds = ref<number[]>([])

  const load = () => {
    const raw = localStorage.getItem('favorites')
    favoriteIds.value = raw ? JSON.parse(raw) : []
  }

  const save = () => {
    localStorage.setItem('favorites', JSON.stringify(favoriteIds.value))
  }

  const toggleFavorite = (id: number) => {
    const index = favoriteIds.value.indexOf(id)
    if (index === -1) {
      favoriteIds.value.push(id)
    } else {
      favoriteIds.value.splice(index, 1)
    }
  }

  const isFavorite = (id: number) => favoriteIds.value.includes(id)

  // Автосохранение
  watch(favoriteIds, save, { deep: true })

  load()

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
  }
})
