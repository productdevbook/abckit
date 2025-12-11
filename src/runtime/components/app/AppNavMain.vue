<script setup lang="ts">
import { Icon } from '#components'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'abckit/shadcn/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from 'abckit/shadcn/sidebar'

defineProps<{
  items: {
    title: string
    url: string
    icon?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
  label?: string
}>()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel v-if="label">
      {{ label }}
    </SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isActive"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <template v-if="!item.items">
            <SidebarMenuButton as-child :tooltip="item.title">
              <NuxtLink :to="item.url">
                <Icon v-if="item.icon" :name="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </template>
          <template v-else>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.title">
                <Icon v-if="item.icon" :name="item.icon" />
                <span>{{ item.title }}</span>
                <Icon name="lucide:chevron-right" class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                  <SidebarMenuSubButton as-child>
                    <NuxtLink :to="subItem.url">
                      <span>{{ subItem.title }}</span>
                    </NuxtLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </template>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
