<script setup lang="ts">
import type { FileType } from 'abckit/types/client'
import { FolderPlus, Search } from 'lucide-vue-next'
import { Button } from 'abckit/shadcn/button'
import { Input } from 'abckit/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'abckit/shadcn/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'abckit/shadcn/tooltip'
import { Icon } from '#components'
import { computed } from 'vue'

type ViewMode = 'grid' | 'list'

interface Props {
  searchQuery?: string
  viewMode?: ViewMode
  selectedType?: FileType | 'all'
  showCreateFolder?: boolean
  showViewToggle?: boolean
  showTypeFilter?: boolean
  showSelectionMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  viewMode: 'grid',
  selectedType: 'all',
  showCreateFolder: true,
  showViewToggle: true,
  showTypeFilter: true,
  showSelectionMode: true,
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:viewMode': [value: ViewMode]
  'update:selectedType': [value: FileType | 'all']
  'create-folder': []
  'toggle-selection-mode': []
}>()

const searchModel = computed({
  get: () => props.searchQuery,
  set: (value: string) => emit('update:searchQuery', value)
})

const viewModeModel = computed({
  get: () => props.viewMode,
  set: (value: ViewMode) => emit('update:viewMode', value)
})

const selectedTypeModel = computed({
  get: () => props.selectedType,
  set: (value: FileType | 'all') => emit('update:selectedType', value)
})
</script>

<template>
  <div class="flex gap-2">
    <!-- Search -->
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        v-model="searchModel"
        placeholder="Dosya ara..."
        class="pl-9 h-10"
      />
    </div>

    <!-- Type filter -->
    <Select v-if="showTypeFilter" v-model="selectedTypeModel">
      <SelectTrigger class="w-[180px]">
        <SelectValue placeholder="Dosya türü" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tüm dosyalar</SelectItem>
        <SelectItem value="IMAGE">Resimler</SelectItem>
        <SelectItem value="VIDEO">Videolar</SelectItem>
        <SelectItem value="DOCUMENT">Belgeler</SelectItem>
        <SelectItem value="OTHER">Diğer</SelectItem>
      </SelectContent>
    </Select>

    <!-- View mode toggle -->
    <div v-if="showViewToggle" class="flex rounded-lg border bg-muted/50 p-1">
      <Button
        size="icon"
        variant="ghost"
        class="h-8 w-8"
        :class="{ 'bg-background shadow-sm': viewMode === 'grid' }"
        @click="viewModeModel = 'grid'"
      >
        <Icon name="lucide:layout-grid" class="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        class="h-8 w-8"
        :class="{ 'bg-background shadow-sm': viewMode === 'list' }"
        @click="viewModeModel = 'list'"
      >
        <Icon name="lucide:layout-list" class="h-4 w-4" />
      </Button>
    </div>

    <!-- Selection mode toggle -->
    <TooltipProvider v-if="showSelectionMode">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="icon" class="h-10 w-10" @click="emit('toggle-selection-mode')">
            <Icon name="lucide:check-square" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Seçim modu</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <!-- Create folder -->
    <TooltipProvider v-if="showCreateFolder">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="icon" class="h-10 w-10" @click="emit('create-folder')">
            <FolderPlus class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Yeni klasör oluştur</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>