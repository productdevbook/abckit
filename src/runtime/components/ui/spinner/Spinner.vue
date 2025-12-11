<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Icon } from '#components'
import { cn } from 'abckit/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Icon
    name="lucide:loader-2"
    role="status"
    aria-label="Loading"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
