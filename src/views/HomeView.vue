<template>
  <div class="mx-auto w-full max-w-[1000px] px-3 sm:px-4 py-4">
    <div v-if="loading" class="text-center text-gray-500 py-10">Загрузка категорий…</div>

    <div v-else>
      <!-- Обманка поля поиска (кликабельная зона) -->
      <button v-if="!isMainButtonActive"
        type="button"
        class="mb-3 w-full rounded-2xl border px-4 py-2.5 bg-white hover:bg-gray-50 active:translate-y-px transition flex items-center gap-2 text-left"
        @click="openSearch"
        aria-label="Открыть поиск"
      >
        <svg class="h-5 w-5 opacity-60" viewBox="0 0 24 24" fill="none">
          <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 17-5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="text-gray-500 select-none">Поиск товаров…</span>
      </button>

      <!-- Хлебные крошки -->
      <nav class="mb-3 text-sm text-gray-600">
        <div class="flex flex-wrap items-center gap-1">
          <template v-for="(crumb, i) in selected.iterateUp()" :key="crumb.id">
            <button
              class="appearance-none bg-transparent p-0 underline underline-offset-2 text-gray-600 hover:text-gray-800"
              @click="selectCategory(crumb)"
            >
              {{ crumb.name }}
            </button>
            <span v-if="i < selected.iterateUp().length - 1" class="mx-1 text-gray-400">/</span>
          </template>
        </div>
      </nav>

      <!-- Подкатегории -->
      <section class="mb-4">
        <div class="-mx-3 sm:mx-0">
          <div class="px-3 sm:px-0 overflow-x-auto scrollbar-none" style="scrollbar-width: none">
            <ul class="inline-flex sm:flex sm:flex-wrap gap-2 min-w-full pr-3">
              <li v-for="cat in selected.children" :key="cat.id">
                <button
                  class="appearance-none px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-800 whitespace-nowrap hover:bg-gray-50"
                  @click="selectCategory(cat)"
                >
                  {{ cat.name }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Список товаров -->
      <section>
        <h2 class="text-base sm:text-lg font-semibold mb-2">
          Товары категории “{{ selected.name }}”
        </h2>

        <div v-if="goodsLoading" class="text-gray-500 py-10 text-center">Загрузка товаров…</div>

        <div v-else-if="goods.length === 0" class="text-gray-400 py-8 text-center">Нет товаров</div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <GoodCard v-for="item in goods" :key="item.good.id" :good="item" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/categoryStore'
import { useGoodsStore } from '@/stores/goodsStore'
import GoodCard from '@/components/GoodCard.vue'
import { useMainButton } from "@/composables/useMainButton";


const categoryStore = useCategoryStore()
const { selected, loading } = storeToRefs(categoryStore)

const goodsStore = useGoodsStore()
const { goods, loading: goodsLoading } = storeToRefs(goodsStore)

onMounted(() => {
  if (!categoryStore.flatList.length) categoryStore.loadCategories()
})

watch(
  () => selected.value?.id,
  (id) => {
    const catId = id && id !== 0 ? Number(id) : undefined
    goodsStore.loadGoods(catId)
  },
  { immediate: true }
)

const selectCategory = (cat: any) => {
  categoryStore.selectCategory(cat)
}

const router = useRouter()

const { isMainButtonActive } = useMainButton({
  text: "Поиск",
  onClick: () => void router.push({ name: "Search", query: { sid: String(Date.now()) } }),
});

const openSearch = () => {
  // Новый «сеанс» поиска: уникальный sid
  router.push({ name: 'Search', query: { sid: String(Date.now()) } })
}
</script>

<style scoped>
/* прячем тонкий нативный скроллбар в WebKit для горизонтального списка чипов */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
