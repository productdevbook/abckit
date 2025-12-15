<script setup lang="ts">
import type { BreadcrumbItemProps } from 'abckit/composables/useBreadcrumbItems'
import type { BreadcrumbsConfig } from '../../../module'
import { useAppConfig } from '#app'
import { NuxtLink } from '#components'
import { useBreadcrumbItems } from 'abckit/composables/useBreadcrumbItems'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'abckit/shadcn/breadcrumb'
import { computed } from 'vue'

const appConfig = useAppConfig()

// Get breadcrumb config from app.config.ts
const breadcrumbConfig = computed<NonNullable<BreadcrumbsConfig['breadcrumbs']>>(() => appConfig.breadcrumbs ?? {})

// Build base URL for prepend
const baseUrl = computed(() => {
  // Check if app has custom baseUrl logic
  if (breadcrumbConfig.value.getBaseUrl) {
    return breadcrumbConfig.value.getBaseUrl(null, null)
  }

  return '/'
})

// Override segments: hide root and dynamic params, but show actual pages
const overrides = computed<(false | BreadcrumbItemProps | undefined)[]>(() => {
  // Check if app has custom overrides
  if (breadcrumbConfig.value.overrides) {
    return breadcrumbConfig.value.overrides
  }

  // Default: hide root, org, and project segments
  return [
    false, // Hide root /
    false, // Hide organization segment
    false, // Hide projectId segment (if exists)
    // Rest will be shown (themes, pages, settings, etc.)
  ]
})

// Home label from config or default
const homeLabel = computed(() => breadcrumbConfig.value.homeLabel || 'Home')
const homeIcon = computed(() => breadcrumbConfig.value.homeIcon || 'lucide:home')

const breadcrumbItems = useBreadcrumbItems({
  hideRoot: true,
  hideNonExisting: true,
  overrides: overrides.value,
  prepend: computed(() => [
    {
      label: homeLabel.value,
      to: baseUrl.value,
      icon: homeIcon.value,
    },
  ]),
})
</script>

<template>
  <Breadcrumb v-if="breadcrumbItems.length > 0">
    <BreadcrumbList>
      <template v-for="(item, index) in breadcrumbItems" :key="item.to || index">
        <BreadcrumbItem>
          <!-- Current page - not clickable -->
          <BreadcrumbPage v-if="item.current">
            <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4 mr-1" />
            {{ item.label }}
          </BreadcrumbPage>

          <!-- Clickable link with NuxtLink -->
          <BreadcrumbLink
            v-else
            :as="NuxtLink"
            :to="item.to || '/'"
          >
            <Icon v-if="item.icon" :name="item.icon" class="h-4 w-4 mr-1" />
            {{ item.label }}
          </BreadcrumbLink>
        </BreadcrumbItem>

        <!-- Separator (not after the last item) -->
        <BreadcrumbSeparator v-if="index < breadcrumbItems.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
