<template>
  <div class="relative w-full h-full">
    <!-- Обычная встраиваемая галерея -->
    <div v-if="!isFullscreen" class="relative w-full h-full select-none" @mousedown="onMouseDown"
      @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
      <div class="relative w-full h-full flex justify-center items-center">
        <!-- Центральный блок с картинкой -->
        <div class="w-full flex justify-center items-center border p-2 h-full min-h-[16rem] relative overflow-hidden">
          <!-- Лоадер -->
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10">
            <div class="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>

          <!-- Картинка (тап по ней -> fullscreen) -->
          <img v-if="showImage && currentImage" :src="currentImage" alt="product image" @load="onImageLoad"
            @error="onImageError" @click="openFullscreen" :class="[
              'max-h-full max-w-full object-contain transition-opacity duration-200 cursor-zoom-in',
              isLoading ? 'opacity-0' : 'opacity-100',
            ]" />

          <!-- Плейсхолдер -->
          <div v-else-if="!isLoading" class="text-gray-400 text-sm text-center px-4">
            Нет изображения
          </div>
        </div>

        <!-- ⬅ Кнопка назад: всегда при >1 фото, поверх картинки -->
        <button v-if="images.length > 1" @click.stop="prev"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow z-20"
          :class="currentIndex === 0 ? 'opacity-40' : ''">
          ‹
        </button>

        <!-- ➡ Кнопка вперёд -->
        <button v-if="images.length > 1 && currentIndex < images.length - 1" @click.stop="next"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 shadow z-20">
          ›
        </button>
      </div>

      <!-- ⚪ Индикаторы -->
      <div v-if="images.length > 1" class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        <span v-for="(_, i) in images" :key="i" class="w-2 h-2 rounded-full"
          :class="i === currentIndex ? 'bg-blue-600' : 'bg-gray-300/80'" />
      </div>
    </div>

    <!-- Полноэкранный режим -->
    <div v-else class="fixed inset-0 bg-black/90 z-[9999] flex flex-col">

      <!-- Верхняя панель -->
      <div class="flex items-center justify-between px-3 pb-2 text-white" :style="{
        paddingTop: 'calc(var(--tma-safe-area-top, env(safe-area-inset-top)) + 48px)'
      }">
        <button class="px-3 py-1 rounded-full bg-white/10 text-sm" @click="closeFullscreen">
          Закрыть
        </button>
        <span class="text-xs opacity-70" v-if="images.length > 1">
          {{ currentIndex + 1 }} / {{ images.length }}
        </span>
      </div>


      <!-- Область просмотра с pinch-zoom -->
      <div class="flex-1 relative overflow-hidden flex items-center justify-center" ref="fsContainer"
        @touchstart.passive="onFsTouchStart" @touchmove.prevent="onFsTouchMove" @touchend="onFsTouchEnd"
        @touchcancel="onFsTouchEnd">
        <img v-if="currentImage" :src="currentImage" alt="product image" class="max-w-full max-h-full object-contain"
          :style="{
            transform: 'translate(' + fsTranslateX + 'px, ' + fsTranslateY + 'px) scale(' + fsScale + ')',
            transition: fsIsAnimating ? 'transform 0.15s ease-out' : 'none'
          }" />

        <!-- Стрелки поверх -->
        <button v-if="images.length > 1" @click.stop="prevFs"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black shadow z-20"
          :class="currentIndex === 0 ? 'opacity-40' : ''">
          ‹
        </button>
        <button v-if="images.length > 1 && currentIndex < images.length - 1" @click.stop="nextFs"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black shadow z-20">
          ›
        </button>
      </div>

      <!-- Индикаторы в полноэкранном режиме -->
      <div v-if="images.length > 1" class="pb-4 flex justify-center gap-1">
        <span v-for="(_, i) in images" :key="'fs-' + i" class="w-2 h-2 rounded-full"
          :class="i === currentIndex ? 'bg-blue-400' : 'bg-gray-500/60'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{ images: string[] }>()

const currentIndex = ref(0)
const showImage = ref(true)

/* Глобальный кэш загруженных картинок */
const globalLoadedSet: Set<string> =
  // @ts-ignore
  (window as any).__goodImagesLoaded ||
  // @ts-ignore
  ((window as any).__goodImagesLoaded = new Set<string>())

const isLoading = ref(false)

const currentImage = computed(() => props.images[currentIndex.value] ?? null)

function onImageLoad() {
  if (currentImage.value) {
    globalLoadedSet.add(currentImage.value)
  }
  isLoading.value = false
  showImage.value = !!currentImage.value
}

function onImageError() {
  isLoading.value = false
  showImage.value = false
}

function next() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

/* Лоадер по смене currentImage */
watch(
  currentImage,
  (url) => {
    if (!url) {
      isLoading.value = false
      showImage.value = false
      return
    }

    if (globalLoadedSet.has(url)) {
      isLoading.value = false
      showImage.value = true
    } else {
      isLoading.value = true
      showImage.value = true
    }
  },
  { immediate: true },
)

/* Свайп (обычный режим): mouse + touch */
let startX = 0
let dx = 0
let dragging = false
const SWIPE_THRESHOLD = 40

function startDrag(x: number) {
  startX = x
  dx = 0
  dragging = true
}

function moveDrag(x: number) {
  if (!dragging) return
  dx = x - startX
}

function endDrag() {
  if (!dragging) return

  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx < 0) next()
    else prev()
  }

  dragging = false
  dx = 0
}

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  startDrag(e.clientX)
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  moveDrag(e.clientX)
}

function onMouseUp() {
  endDrag()
}

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  startDrag(t.clientX)
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  moveDrag(t.clientX)
}

function onTouchEnd() {
  endDrag()
}

/* ===== Полноэкранный режим с pinch-zoom ===== */
const isFullscreen = ref(false)

const fsScale = ref(1)
const fsTranslateX = ref(0)
const fsTranslateY = ref(0)
const fsIsAnimating = ref(false)

const MIN_SCALE = 1
const MAX_SCALE = 4

let fsLastTouchX = 0
let fsLastTouchY = 0
let fsPinchStartDistance = 0
let fsPinchStartScale = 1

function openFullscreen() {
  if (!currentImage.value) return
  isFullscreen.value = true
  resetFsTransform()
}

function closeFullscreen() {
  isFullscreen.value = false
  resetFsTransform()
}

function resetFsTransform() {
  fsScale.value = 1
  fsTranslateX.value = 0
  fsTranslateY.value = 0
  fsPinchStartDistance = 0
  fsPinchStartScale = 1
  fsIsAnimating.value = false
}

function distance(t1: Touch, t2: Touch) {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.hypot(dx, dy)
}

function onFsTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    fsPinchStartDistance = distance(t1, t2)
    fsPinchStartScale = fsScale.value
  } else if (e.touches.length === 1) {
    const t = e.touches[0]
    fsLastTouchX = t.clientX
    fsLastTouchY = t.clientY
  }
}

function onFsTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const dist = distance(t1, t2)
    if (!fsPinchStartDistance) return

    let nextScale = fsPinchStartScale * (dist / fsPinchStartDistance)
    if (nextScale < MIN_SCALE) nextScale = MIN_SCALE
    if (nextScale > MAX_SCALE) nextScale = MAX_SCALE

    fsScale.value = nextScale
  } else if (e.touches.length === 1 && fsScale.value > 1) {
    const t = e.touches[0]
    const deltaX = t.clientX - fsLastTouchX
    const deltaY = t.clientY - fsLastTouchY
    fsTranslateX.value += deltaX
    fsTranslateY.value += deltaY
    fsLastTouchX = t.clientX
    fsLastTouchY = t.clientY
  }
}

function onFsTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    fsPinchStartDistance = 0
    fsPinchStartScale = fsScale.value
  }
}

/* Переключение картинок в полноэкранном режиме */
function nextFs() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    fsIsAnimating.value = true
    resetFsTransform()
    setTimeout(() => (fsIsAnimating.value = false), 150)
  }
}

function prevFs() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    fsIsAnimating.value = true
    resetFsTransform()
    setTimeout(() => (fsIsAnimating.value = false), 150)
  }
}
</script>
