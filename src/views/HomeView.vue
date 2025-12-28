<template>
  <div class="mx-auto w-full max-w-[1000px] px-3 sm:px-4 py-4">
    <div v-if="loading" class="text-center text-gray-500 py-10">Загрузка категорий…</div>

    <div v-else>
      <!-- Обманка поля поиска (кликабельная зона) -->
      <button type="button"
        class="mb-3 w-full rounded-2xl border px-4 py-2.5 bg-white hover:bg-gray-50 active:translate-y-px transition flex items-center gap-2 text-left"
        @click="openSearch" aria-label="Открыть поиск">
        <!-- иконка -->
        <span class="text-gray-500 select-none">Поиск товаров…</span>
      </button>

      <!-- Хлебные крошки -->
      <nav class="mb-3 text-sm text-gray-600">
        <div class="flex flex-wrap items-center gap-1">
          <!-- Стрелка назад к родительской категории -->
          <button v-if="canGoBackCategory" type="button"
            class="mr-1 flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 active:translate-y-px"
            @click="goBackCategory" aria-label="Назад к предыдущей категории">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <template v-for="(crumb, i) in selected.iterateUp()" :key="crumb.id">
            <button
              class="appearance-none bg-transparent p-0 underline underline-offset-2 text-gray-600 hover:text-gray-800"
              @click="selectCategory(crumb)">
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
                  @click="selectCategory(cat)">
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

      <!-- Кнопка загрузки ещё -->
      <div v-if="hasMore" ref="loadMoreRef" class="h-10"></div>

      <div v-if="loadingMore" class="text-center text-gray-400 py-4">
        Загрузка ещё…
      </div>

    </div>

    <!-- Кнопка "Наверх" -->
<button
  v-show="showScrollTop"
  @click="scrollToTop"
  class="fixed bottom-6 right-4 z-30
         rounded-full bg-gray-900 text-white
         w-11 h-11 flex items-center justify-center
         shadow-lg hover:bg-gray-800 active:scale-95 transition"
  aria-label="Наверх"
>
  ↑
</button>

  </div>
</template>

<script setup lang="ts">

defineOptions({
  name: 'Home',
})

import { onMounted, watch, computed, onBeforeUnmount, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useCategoryStore } from '@/stores/categoryStore'
import { useGoodsStore } from '@/stores/goodsStore'
import GoodCard from '@/components/GoodCard.vue'
import { useScrollStore } from '@/stores/scrollStore'

const router = useRouter()
const route = useRoute()
const scrollStore = useScrollStore()

const categoryStore = useCategoryStore()
const { selected, loading } = storeToRefs(categoryStore)

const goodsStore = useGoodsStore()
const { goods, loading: goodsLoading, hasMore, loadingMore } = storeToRefs(goodsStore)

const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// --- Scroll to top ---
const showScrollTop = ref(false)

const onScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// ✅ флаг: восстановление скролла делаем только один раз при входе на Home
const restored = ref(false)

onBeforeRouteLeave(() => {
  scrollStore.save(route.fullPath, window.scrollY)
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll() // на случай, если восстановили скролл

  // категории
  if (!categoryStore.flatList.length) {
    categoryStore.loadCategories()
  }

  // первая загрузка товаров
  if (!goodsStore.isInitialLoaded) {
    const catId =
      selected.value?.id && selected.value.id !== 0
        ? Number(selected.value.id)
        : undefined

    goodsStore.loadGoods(catId)
  }

  // observer для пагинации
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      if (!goodsStore.isInitialLoaded) return
      if (goodsLoading.value) return

      const catId =
        selected.value?.id && selected.value.id !== 0
          ? Number(selected.value.id)
          : undefined

      goodsStore.loadGoods(catId)
    },
    { rootMargin: '200px' }
  )

  if (loadMoreRef.value) observer.observe(loadMoreRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})

watch(loadMoreRef, (el) => {
  if (el && observer) observer.observe(el)
})

// ✅ ВОССТАНОВЛЕНИЕ СКРОЛЛА: только когда контент уже реально есть
watch(
  [() => goods.value.length, () => goodsLoading.value],
  async ([_len, isLoading]) => {
    if (restored.value) return
    if (isLoading) return

    const y = scrollStore.get(route.fullPath)
    if (y <= 0) {
      restored.value = true
      return
    }

    // ждём, пока DOM действительно отрисуется
    await nextTick()
    // иногда в WebView нужно “два такта”
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'auto' })
      restored.value = true
    })
  },
  { immediate: true }
)

// смена категории → скролл вверх + новая загрузка
watch(
  () => selected.value?.id,
  (id, prevId) => {
    if (id === prevId) return

    restored.value = true // чтобы не пытаться восстановить старый скролл
    window.scrollTo({ top: 0, behavior: 'auto' })

    const catId = id && id !== 0 ? Number(id) : undefined
    goodsStore.loadGoods(catId)
  }
)

const selectCategory = (cat: any) => {
  categoryStore.selectCategory(cat)
}

const canGoBackCategory = computed(() => !!selected.value?.parent)

const goBackCategory = () => {
  const parent = selected.value?.parent
  if (parent) {
    categoryStore.selectCategory(parent)
  }
}

const openSearch = () => {
  router.push({ name: 'Search', query: { sid: String(Date.now()) } })
}
</script>

<style scoped>
/* прячем тонкий нативный скроллбар в WebKit для горизонтального списка чипов */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
