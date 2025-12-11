<script setup lang="ts">
import { Icon } from '#components'
import { Button } from 'abckit/shadcn/button'

interface Props {
  selectedCount: number
  isSelectionMode: boolean
  isTrash?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTrash: false,
})

const emit = defineEmits<{
  'toggle-selection-mode': []
  'clear-selection': []
  'select-all': []
  'delete-selected': []
  'restore-selected': []
}>()
</script>

<template>
  <div v-if="isSelectionMode" class="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      @click="emit('clear-selection')"
    >
      İptal
    </Button>
    
    <Button
      v-if="selectedCount === 0"
      variant="outline"
      size="sm"
      @click="emit('select-all')"
    >
      Tümünü Seç
    </Button>
    
    <Button
      v-if="selectedCount > 0 && isTrash"
      size="sm"
      @click="emit('restore-selected')"
    >
      <Icon name="lucide:rotate-ccw" class="mr-2 h-4 w-4" />
      Geri Yükle ({{ selectedCount }})
    </Button>
    
    <Button
      v-if="selectedCount > 0"
      variant="destructive"
      size="sm"
      @click="emit('delete-selected')"
    >
      <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
      {{ isTrash ? 'Kalıcı Olarak' : '' }} Sil ({{ selectedCount }})
    </Button>
  </div>
</template>