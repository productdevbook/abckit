<script setup lang="ts">
import { Icon } from '#components'
import { SidebarMenuButton, useSidebar } from 'abckit/shadcn/sidebar'

interface Props {
  tenant?: {
    name?: string
    logo?: string
  }
}

const props = defineProps<Props>()
const { state } = useSidebar()
</script>

<template>
  <SidebarMenuButton
    size="lg"
    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
  >
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Icon name="lucide:shield" class="h-4 w-4" />
    </div>
    <div
      v-show="state !== 'collapsed'"
      class="grid flex-1 text-left text-sm leading-tight transition-all duration-200"
    >
      <span class="truncate font-semibold">Admin Panel</span>
      <span class="truncate text-xs text-muted-foreground">{{ props.tenant?.name || 'Bardak App' }}</span>
    </div>
  </SidebarMenuButton>
</template>
