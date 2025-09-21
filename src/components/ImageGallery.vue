<template>
  <div
    class="relative w-full flex flex-col items-center select-none"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
    @pointerleave="onUp"
  >
    <div class="relative w-full flex justify-center items-center">
      <!-- ⬅ Кнопка назад -->
      <button
        v-if="images.length > 1 && currentIndex > 0"
        @click="prev"
        class="absolute left-0 p-2 rounded bg-white shadow"
      >
        ‹
      </button>

      <!-- 🖼 Изображение или плейсхолдер -->
      <div class="w-full flex justify-center items-center border p-2 h-64">
        <img
          v-if="showImage && currentImage"
          :src="currentImage"
          alt="product image"
          class="max-h-full object-contain"
          @error="onImageError"
        />
        <div
          v-else
          class="text-gray-400 text-sm text-center"
        >
          Нет изображения
        </div>
      </div>

      <!-- ➡ Кнопка вперёд -->
      <button
        v-if="images.length > 1 && currentIndex < images.length - 1"
        @click="next"
        class="absolute right-0 p-2 rounded bg-white shadow"
      >
        ›
      </button>
    </div>

    <!-- ⚪ Индикаторы -->
    <div v-if="images.length > 1" class="mt-2 flex gap-1">
      <span
        v-for="(_, i) in images"
        :key="i"
        class="w-2 h-2 rounded-full"
        :class="i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{ images: string[] }>()
const currentIndex = ref(0)
const showImage = ref(true)

const currentImage = computed(() => props.images[currentIndex.value] ?? null)

function onImageError() {
  showImage.value = false
}

function next() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    showImage.value = true
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showImage.value = true
  }
}

watch(currentImage, () => {
  showImage.value = true
})

/* ===== Логика свайпа ===== */
let startX = 0
let dx = 0
let dragging = false
const SWIPE_THRESHOLD = 40 // порог в пикселях

function onDown(e: PointerEvent) {
  startX = e.clientX
  dx = 0
  dragging = true
}

function onMove(e: PointerEvent) {
  if (!dragging) return
  dx = e.clientX - startX
}

function onUp() {
  if (!dragging) return
  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx < 0) next()
    else prev()
  }
  dragging = false
  dx = 0
}
</script>