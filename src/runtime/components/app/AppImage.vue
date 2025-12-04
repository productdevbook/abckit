<script setup lang="ts">
import type { ImageSize } from 'abckit/composables/useImageUrl'
import { useImageUrl } from 'abckit/composables/useImageUrl'
import { cn } from 'abckit/utils'
import { computed } from 'vue'

interface Props {
  src?: string | null
  alt?: string
  class?: string
  fallback?: string
  size?: ImageSize
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  class: '',
  fallback: '/images/placeholder.svg',
  size: 'lg',
})

// Use the image URL composable
const { getImageUrl } = useImageUrl()

// Computed image URL using getImageUrl helper with size
const imageUrl = computed(() => {
  if (!props.src) {
    return props.fallback
  }
  return getImageUrl(props.src, props.size)
})

// Handle image load errors
function onError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== props.fallback) {
    img.src = props.fallback
  }
}

// Use class instead of className for Vue
const className = computed(() => props.class)
</script>

<template>
  <img
    :src="imageUrl"
    :alt="alt"
    :class="cn(
      'object-cover',
      className,
    )"
    v-bind="$attrs"
    @error="onError"
  >
</template>
