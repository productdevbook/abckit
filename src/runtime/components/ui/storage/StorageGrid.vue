<script setup lang="ts">
import type { FileType } from 'abckit/types/client'
import { Cloud, FileText, Film, Folder, Image, MoreVertical } from 'lucide-vue-next'
import { bytesToSize } from 'abckit/shared/constants/r2'
import { Button } from 'abckit/shadcn/button'
import { Checkbox } from 'abckit/shadcn/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from 'abckit/shadcn/dropdown-menu'
import { AppImage } from 'abckit/components/app'
import { Icon } from '#components'
import type { Component } from 'vue'

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
  isSelectionMode?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelectionMode: false,
  showActions: true,
})

const emit = defineEmits<{
  fileClick: [file: FileItem]
  folderClick: [file: FileItem]
  toggleSelection: [fileId: string]
  fileAction: [action: string, file: FileItem]
}>()

// File type icons
const FILE_TYPE_ICONS: Record<FileType | 'FOLDER', Component> = {
  IMAGE: Image,
  VIDEO: Film,
  DOCUMENT: FileText,
  OTHER: Cloud,
  FOLDER: Folder,
}

function getFileIcon(file: FileItem) {
  if (file.isFolder) return FILE_TYPE_ICONS.FOLDER
  return FILE_TYPE_ICONS[file.type]
}

function handleClick(file: FileItem) {
  if (props.isSelectionMode) {
    emit('toggleSelection', file.id)
  } else if (file.isFolder) {
    emit('folderClick', file)
  } else {
    emit('fileClick', file)
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
      :class="{ 'ring-2 ring-primary': isSelectionMode && isSelected(file.id) }"
      @click="handleClick(file)"
    >
      <!-- Selection checkbox -->
      <div
        v-if="isSelectionMode"
        class="absolute left-2 top-2 z-10"
        @click.stop
      >
        <Checkbox
          :model-value="isSelected(file.id)"
          @update:model-value="emit('toggleSelection', file.id)"
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

      <!-- Actions -->
      <div v-if="showActions" class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              size="icon"
              variant="ghost"
              class="h-8 w-8 bg-background/80 backdrop-blur-sm"
              @click.stop
            >
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <slot name="file-actions" :file="file">
              <!-- Default actions - can be overridden -->
              <DropdownMenuItem @click.stop="emit('fileAction', 'view', file)">
                <Icon name="lucide:eye" class="mr-2 h-4 w-4" />
                {{ file.isFolder ? 'Aç' : 'Görüntüle' }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="!file.isFolder" @click.stop="emit('fileAction', 'download', file)">
                <Icon name="lucide:download" class="mr-2 h-4 w-4" />
                İndir
              </DropdownMenuItem>
              <DropdownMenuItem @click.stop="emit('fileAction', 'rename', file)">
                <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                Yeniden Adlandır
              </DropdownMenuItem>
              <DropdownMenuItem @click.stop="emit('fileAction', 'move', file)">
                <Icon name="lucide:folder-input" class="mr-2 h-4 w-4" />
                Taşı
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                @click.stop="emit('fileAction', 'delete', file)"
              >
                <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </slot>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>