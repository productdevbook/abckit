<script lang="ts" setup>
import type { RangeCalendarPrevProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Icon } from '#components'
import { RangeCalendarPrev, useForwardProps } from "reka-ui"
import { cn } from 'abckit/utils'
import { buttonVariants } from 'abckit/shadcn/button'

const props = defineProps<RangeCalendarPrevProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RangeCalendarPrev
    data-slot="range-calendar-prev-button"
    :class="cn(
      buttonVariants({ variant: 'outline' }),
      'absolute left-1',
      'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot>
      <Icon name="lucide:chevron-left" class="size-4" />
    </slot>
  </RangeCalendarPrev>
</template>
