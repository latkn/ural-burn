<script setup lang="ts">
import { computed } from 'vue'
import { splitParagraphs, parseBoldSegments, type TextSegment } from '@/lib/richText'

const props = withDefaults(
  defineProps<{
    text: string
    /** Один блок без разбиения по \\n\\n — для подписей и вариантов ответов */
    inline?: boolean
  }>(),
  { inline: false }
)

const paragraphs = computed(() =>
  props.inline ? [props.text] : splitParagraphs(props.text)
)

function segments(para: string): TextSegment[] {
  return parseBoldSegments(para)
}
</script>

<template>
  <!-- span + block для валидной вложенности внутри <label> -->
  <span
    v-if="inline"
    class="block whitespace-pre-line text-lg leading-relaxed text-burn-cream/90"
  >
    <template v-for="(seg, j) in segments(text)" :key="j">
      <strong v-if="seg.bold" class="font-semibold text-burn-cream">{{ seg.text }}</strong>
      <template v-else>{{ seg.text }}</template>
    </template>
  </span>
  <div
    v-else
    class="space-y-5 text-lg leading-relaxed text-burn-cream/90 sm:text-xl sm:leading-relaxed"
  >
    <p v-for="(para, i) in paragraphs" :key="i" class="m-0 whitespace-pre-line">
      <template v-for="(seg, j) in segments(para)" :key="j">
        <strong v-if="seg.bold" class="font-semibold text-burn-cream">{{ seg.text }}</strong>
        <template v-else>{{ seg.text }}</template>
      </template>
    </p>
  </div>
</template>
