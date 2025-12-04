<script setup lang="ts">
import type { FileType } from 'abckit/types/client'
import { Cloud, FileText, Film, Folder, Image, MoreVertical } from 'lucide-vue-next'
import { bytesToSize } from 'abckit/shared/constants/r2'
import { Badge } from 'abckit/shadcn/badge'
import { Button } from 'abckit/shadcn/button'
import { Checkbox } from 'abckit/shadcn/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from 'abckit/shadcn/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'abckit/shadcn/table'
import { AppImage } from 'abckit/components/app'
import { Icon } from '#components'
import type { Component } from 'vue'
import { computed } from 'vue'

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
  isTrash?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelectionMode: false,
  showActions: true,
  isTrash: false,
})

// File type icons

const emit = defineEmits<{
  fileClick: [file: FileItem]
  folderClick: [file: FileItem]
  toggleSelection: [fileId: string]
  selectAll: [selected: boolean]
  fileAction: [action: string, file: FileItem]
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

// File type labels
const FILE_TYPE_LABELS: Record<FileType, string> = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  DOCUMENT: 'Document',
  ARCHIVE: 'Archive',
  OTHER: 'Other',
}

function getFileIcon(file: FileItem) {
  if (file.isFolder) return FILE_TYPE_ICONS.FOLDER
  return FILE_TYPE_ICONS[file.type]
}

function getFileTypeLabel(file: FileItem): string {
  if (file.isFolder) return 'Folder'
  return FILE_TYPE_LABELS[file.type]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function handleRowClick(file: FileItem) {
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

const allSelected = computed(() =>
  props.files.length > 0 && props.files.every(file => isSelected(file.id)),
)

const someSelected = computed(() =>
  props.files.some(file => isSelected(file.id)) && !allSelected.value,
)
</script>

<template>
  <div class="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead v-if="isSelectionMode" class="w-[50px]">
            <Checkbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              @update:model-value="(value) => emit('selectAll', value as boolean)"
            />
          </TableHead>
          <TableHead>Dosya Adı</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Boyut</TableHead>
          <TableHead>{{ isTrash ? 'Silinme Tarihi' : 'Yüklenme Tarihi' }}</TableHead>
          <TableHead v-if="showActions" class="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="file in files"
          :key="file.id"
          class="cursor-pointer"
          :class="{ 'bg-muted/50': isSelectionMode && isSelected(file.id) }"
          @click="handleRowClick(file)"
        >
          <TableCell v-if="isSelectionMode" @click.stop>
            <Checkbox
              :model-value="isSelected(file.id)"
              @update:model-value="emit('toggleSelection', file.id)"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                <AppImage
                  v-if="!file.isFolder && file.type === 'IMAGE'"
                  :src="file.r2Key"
                  :alt="file.originalName"
                  size="xs"
                  class="h-full w-full"
                  fallback=""
                />
                <component
                  v-else
                  :is="getFileIcon(file)"
                  class="h-5 w-5 text-muted-foreground"
                />
              </div>
              <div>
                <p class="font-medium">{{ file.originalName }}</p>
                <p class="text-xs text-muted-foreground">{{ file.isFolder ? 'Klasör' : file.mimeType }}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              {{ getFileTypeLabel(file) }}
            </Badge>
          </TableCell>
          <TableCell class="text-muted-foreground">
            {{ file.isFolder ? '-' : bytesToSize(file.size) }}
          </TableCell>
          <TableCell class="text-muted-foreground">
            {{ formatDate(isTrash && file.deletedAt ? file.deletedAt : file.createdAt) }}
          </TableCell>
          <TableCell v-if="showActions" class="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-8 w-8"
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
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>