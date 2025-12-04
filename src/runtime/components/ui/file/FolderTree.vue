<script setup lang="ts">
import { useFiles } from 'abckit/graphql/organization'
import { FolderTree } from './index'
import { RadioGroupItem } from 'abckit/shadcn/radio-group'
import { computed, ref } from 'vue'
import { Icon } from '#components'

interface Props {
  currentFolderId?: string
  excludedFolderId?: string
  selectedFolderId?: string
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
})

const emit = defineEmits<{
  select: [folderId: string]
}>()

const selectedFolderId = defineModel<string | undefined>('selectedFolderId')

// Fetch folders for current level
const { data: filesData } = useFiles(1, 100, undefined, props.currentFolderId)

// Filter only folders and exclude the file being moved
const folders = computed(() => {
  return filesData.value?.data?.files?.files?.filter((file: any) =>
    file.isFolder && file.id !== props.excludedFolderId,
  ) || []
})

const isExpanded = ref<Record<string, boolean>>({})

function toggleFolder(folderId: string) {
  isExpanded.value[folderId] = !isExpanded.value[folderId]
}

function selectFolder(folderId: string) {
  selectedFolderId.value = folderId
  emit('select', folderId)
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-for="folder in folders"
      :key="folder.id"
      :style="{ paddingLeft: `${level * 1.5}rem` }"
    >
      <div class="flex items-center space-x-2 p-2 rounded hover:bg-muted">
        <RadioGroupItem
          :value="folder.id"
          @click="selectFolder(folder.id)"
        />
        <button
          type="button"
          class="flex items-center gap-1 flex-1 text-left"
          @click="toggleFolder(folder.id)"
        >
          <Icon
            :name="isExpanded[folder.id] ? 'lucide:chevron-down' : 'lucide:chevron-right'"
            class="h-4 w-4"
          />
          <Icon name="lucide:folder" class="h-4 w-4" />
          <span class="text-sm">{{ folder.originalName }}</span>
        </button>
      </div>

      <!-- Nested folders -->
      <div v-if="isExpanded[folder.id]">
        <FolderTree
          :current-folder-id="folder.id"
          :excluded-folder-id="props.excludedFolderId"
          :selected-folder-id="selectedFolderId"
          :level="level + 1"
          @select="selectFolder"
        />
      </div>
    </div>
  </div>
</template>
