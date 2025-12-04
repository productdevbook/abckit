<script setup lang="ts">
import { useColorMode } from '#imports'
import { Icon } from '#components'

const colorMode = useColorMode()

function toggleDarkMode() {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = newMode
}
</script>

<template>
  <button
    class="flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors"
    @click="toggleDarkMode"
  >
    <ClientOnly>
      <Icon
        :name="colorMode.value === 'dark' ? 'lucide:sun' : 'lucide:moon'"
        class="h-4 w-4"
      />
      <template #fallback>
        <Icon name="lucide:moon" class="h-4 w-4" />
      </template>
    </ClientOnly>
  </button>
</template> 