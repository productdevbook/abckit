<script setup lang="ts">
import type { PaginationNextProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from 'abckit/shadcn/button'
import { reactiveOmit } from "@vueuse/core"
import { Icon } from '#components'
import { PaginationNext, useForwardProps } from "reka-ui"
import { cn } from 'abckit/utils'
import { buttonVariants } from 'abckit/shadcn/button'

const props = withDefaults(defineProps<PaginationNextProps & {
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}>(), {
  size: "default",
})

const delegatedProps = reactiveOmit(props, "class", "size")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <PaginationNext
    data-slot="pagination-next"
    :class="cn(buttonVariants({ variant: 'ghost', size }), 'gap-1 px-2.5 sm:pr-2.5', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <span class="hidden sm:block">Next</span>
      <Icon name="lucide:chevron-right" />
    </slot>
  </PaginationNext>
</template>
