import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCategories } from '@/api/categories'
import type { CategoryDataModel } from '@/types/models'
import { Category } from '@/models/category'

export const useCategoryStore = defineStore('categories', () => {
  const flatList = ref<CategoryDataModel[]>([])
  const tree = ref<Category>(Category.root)
  const selected = ref<Category>(Category.root)

  const loading = ref(false)

  const loadCategories = async () => {
    loading.value = true
    flatList.value = await fetchCategories()
    buildCategoryTree()
    loading.value = false
  }

  const buildCategoryTree = () => {
    const root = Category.root
    root.children = []
    const categoryMap = new Map<number, Category>()

    flatList.value.forEach(data => {
      const cat = new Category(data.id, data.name)
      categoryMap.set(cat.id, cat)
    })

    flatList.value.forEach(data => {
      const category = categoryMap.get(data.id)!
      if (data.parentId == null) {
        root.addChild(category)
      } else {
        const parent = categoryMap.get(data.parentId)
        parent?.addChild(category)
      }
    })

    tree.value = root
  }

  const selectCategory = (cat: Category) => {
    selected.value = cat
  }

  return {
    flatList,
    tree,
    selected,
    loading,
    loadCategories,
    selectCategory,
  }
})
