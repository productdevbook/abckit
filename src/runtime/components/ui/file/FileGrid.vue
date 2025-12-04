<script setup lang="ts">
import type { FileType } from 'abckit/types/client'
import { Cloud, FileText, Film, Folder, Image } from 'lucide-vue-next'
import { bytesToSize } from 'abckit/shared/constants/r2'
import type { Component } from 'vue'
import { AppImage } from 'abckit/components/app'

interface FileItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  r2Key: string
  type: FileType
  parentId?: string | null
  isFolder?: boolean
  path?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  user?: {
    id: string
    email: string
  } | null
}

interface Props {
  files: FileItem[]
  selectedFiles?: Set<string>
  showSelection?: boolean
  onFileClick?: (file: FileItem) => void
  onFolderClick?: (file: FileItem) => void
}

const props = withDefaults(defineProps<Props>(), {
  showSelection: true,
})

const emit = defineEmits<{
  select: [file: FileItem]
  folderClick: [file: FileItem]
}>()

// File type icons
const FILE_TYPE_ICONS: Record<FileType | 'FOLDER', Component> = {
  IMAGE: Image,
  VIDEO: Film,
  AUDIO: FileText,
  DOCUMENT: FileText,
  ARCHIVE: Cloud,
  OTHER: Cloud,
  FOLDER: Folder,
}

function getFileIcon(file: FileItem) {
  if (file.isFolder)
    return FILE_TYPE_ICONS.FOLDER
  return FILE_TYPE_ICONS[file.type]
}

function handleClick(file: FileItem) {
  if (file.isFolder && props.onFolderClick) {
    props.onFolderClick(file)
  }
  else if (props.onFileClick) {
    props.onFileClick(file)
  }
  else {
    emit('select', file)
  }
}

function isSelected(fileId: string): boolean {
  return props.selectedFiles?.has(fileId) || false
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    <div
      v-for="file in files"
      :key="file.id"
      class="group relative cursor-pointer rounded-lg border bg-card transition-all hover:shadow-md"
      :class="{ 'ring-2 ring-primary': showSelection && isSelected(file.id) }"
      @click="handleClick(file)"
    >
      <!-- Selection checkbox -->
      <div
        v-if="showSelection && isSelected(file.id)"
        class="absolute left-2 top-2 z-10"
        @click.stop
      >
        <Checkbox
          :model-value="isSelected(file.id)"
          @update:model-value="() => handleClick(file)"
        />
      </div>

      <!-- File preview -->
      <div class="aspect-square overflow-hidden rounded-t-lg bg-muted">
        <AppImage
          v-if="!file.isFolder && file.type === 'IMAGE'"
          :src="file.r2Key"
          :alt="file.originalName"
          size="md"
          class="h-full w-full"
          fallback=""
        />
        <div v-else class="flex h-full items-center justify-center">
          <component
            :is="getFileIcon(file)"
            class="h-12 w-12 text-muted-foreground"
          />
        </div>
      </div>

      <!-- File info -->
      <div class="p-3">
        <p class="truncate text-sm font-medium">{{ file.originalName }}</p>
        <p class="text-xs text-muted-foreground">
          <template v-if="file.isFolder">
            Klasör
          </template>
          <template v-else>
            {{ bytesToSize(file.size) }}
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
