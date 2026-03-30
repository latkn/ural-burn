<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Все картинки из папки src/assets/gallery подхватываются при сборке
const galleryModules = import.meta.glob<string>(
  '@/assets/gallery/*.{jpg,jpeg,png,gif,webp}',
  { eager: true, query: '?url', import: 'default' }
)
const galleryUrls = computed(() => Object.values(galleryModules).filter(Boolean).sort())

const lightboxIndex = ref<number | null>(null)
const openLightbox = (index: number) => { lightboxIndex.value = index }
const closeLightbox = () => { lightboxIndex.value = null }
const goPrev = () => {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = lightboxIndex.value <= 0 ? galleryUrls.value.length - 1 : lightboxIndex.value - 1
}
const goNext = () => {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = lightboxIndex.value >= galleryUrls.value.length - 1 ? 0 : lightboxIndex.value + 1
}

const showLightbox = computed(() => lightboxIndex.value !== null)
const currentUrl = computed(() =>
  lightboxIndex.value !== null ? galleryUrls.value[lightboxIndex.value] : ''
)

function onKeydown(e: KeyboardEvent) {
  if (!showLightbox.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') goPrev()
  if (e.key === 'ArrowRight') goNext()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="px-4 py-16 border-t border-burn-border">
    <div class="max-w-5xl mx-auto">
      <h2 class="font-display text-2xl text-burn-cream mb-6">Фотографии c Wild Tribe 2025</h2>
      <p v-if="galleryUrls.length === 0" class="text-burn-muted text-sm">
        Добавьте изображения в папку <code class="bg-burn-card px-1 rounded">src/assets/gallery</code> — они появятся здесь.
      </p>
      <div v-else class="grid grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
        <button
          v-for="(url, index) in galleryUrls"
          :key="url"
          type="button"
          class="aspect-square rounded-lg overflow-hidden border border-burn-border focus:outline-none focus:ring-2 focus:ring-burn-orange focus:ring-offset-2 focus:ring-offset-burn-dark"
          @click="openLightbox(index)"
        >
          <img :src="url" :alt="`Фото ${index + 1}`" class="w-full h-full object-cover" />
        </button>
      </div>
    </div>

    <!-- Лайтбокс -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="showLightbox && currentUrl"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
          @click.self="closeLightbox"
        >
          <button
            type="button"
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-burn-card border border-burn-border text-burn-cream hover:bg-burn-orange hover:text-burn-black transition"
            aria-label="Закрыть"
            @click="closeLightbox"
          >
            ×
          </button>
          <button
            v-if="galleryUrls.length > 1"
            type="button"
            class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-burn-card/90 border border-burn-border text-burn-cream hover:bg-burn-orange hover:text-burn-black transition"
            aria-label="Предыдущее"
            @click="goPrev"
          >
            ‹
          </button>
          <img
            :src="currentUrl"
            alt="Просмотр"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
          <button
            v-if="galleryUrls.length > 1"
            type="button"
            class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-burn-card/90 border border-burn-border text-burn-cream hover:bg-burn-orange hover:text-burn-black transition"
            aria-label="Следующее"
            @click="goNext"
          >
            ›
          </button>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
