<script setup lang="ts">
import type { FileType } from 'abckit/types/client'
import { Cloud, Download, Eye, FileText, Film, Folder, Image, MoreVertical, RotateCcw, Trash2 } from 'lucide-vue-next'
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
  showSelection?: boolean
  showActions?: boolean
  isTrash?: boolean
  onFileClick?: (file: FileItem) => void
  onFolderClick?: (file: FileItem) => void
  onSelectAll?: (selected: boolean) => void
  onToggleSelection?: (file: FileItem) => void
  onView?: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onRename?: (file: FileItem) => void
  onMove?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  onRestore?: (file: FileItem) => void
  onPermanentDelete?: (file: FileItem) => void
}

const props = withDefaults(defineProps<Props>(), {
  showSelection: true,
  showActions: false,
  isTrash: false,
})

// File type icons
const FILE_TYPE_ICONS: Record<FileType | 'FOLDER', Component> = {
  IMAGE: Image,
  VIDEO: Film,
  DOCUMENT: FileText,
  OTHER: Cloud,
  FOLDER: Folder,
}

// File type labels
const FILE_TYPE_LABELS: Record<FileType, string> = {
  IMAGE: 'Resim',
  VIDEO: 'Video',
  DOCUMENT: 'Belge',
  OTHER: 'Diğer',
}

function getFileIcon(file: FileItem) {
  if (file.isFolder)
    return FILE_TYPE_ICONS.FOLDER
  return FILE_TYPE_ICONS[file.type]
}

function getFileTypeLabel(file: FileItem): string {
  if (file.isFolder)
    return 'Klasör'
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
  if (file.isFolder && props.onFolderClick) {
    props.onFolderClick(file)
  }
  else if (props.onFileClick) {
    props.onFileClick(file)
  }
  else if (props.onToggleSelection) {
    props.onToggleSelection(file)
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
          <TableHead v-if="showSelection" class="w-[50px]">
            <Checkbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              @update:model-value="(value) => onSelectAll?.(value as boolean)"
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
          :class="{ 'bg-muted/50': showSelection && isSelected(file.id) }"
          @click="handleRowClick(file)"
        >
          <TableCell v-if="showSelection" @click.stop>
            <Checkbox
              :model-value="isSelected(file.id)"
              @update:model-value="() => onToggleSelection?.(file)"
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
                  :is="getFileIcon(file)"
                  v-else
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
                <template v-if="!isTrash">
                  <template v-if="file.isFolder">
                    <DropdownMenuItem v-if="onView" @click.stop="onView(file)">
                      <Icon name="lucide:folder-open" class="mr-2 h-4 w-4" />
                      Aç
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="onRename" @click.stop="onRename(file)">
                      <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                      Yeniden Adlandır
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="onMove" @click.stop="onMove(file)">
                      <Icon name="lucide:folder-input" class="mr-2 h-4 w-4" />
                      Taşı
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      v-if="onDelete"
                      class="text-destructive focus:text-destructive"
                      @click.stop="onDelete(file)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </template>
                  <template v-else>
                    <DropdownMenuItem v-if="onView" @click.stop="onView(file)">
                      <Eye class="mr-2 h-4 w-4" />
                      Görüntüle
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="onDownload" @click.stop="onDownload(file)">
                      <Download class="mr-2 h-4 w-4" />
                      İndir
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="onRename" @click.stop="onRename(file)">
                      <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                      Yeniden Adlandır
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="onMove" @click.stop="onMove(file)">
                      <Icon name="lucide:folder-input" class="mr-2 h-4 w-4" />
                      Taşı
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      v-if="onDelete"
                      class="text-destructive focus:text-destructive"
                      @click.stop="onDelete(file)"
                    >
                      <Trash2 class="mr-2 h-4 w-4" />
                      Çöp Kutusuna Taşı
                    </DropdownMenuItem>
                  </template>
                </template>
                <template v-else>
                  <DropdownMenuItem v-if="onRestore" @click.stop="onRestore(file)">
                    <RotateCcw class="mr-2 h-4 w-4" />
                    Geri Yükle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    v-if="onDelete"
                    class="text-destructive focus:text-destructive"
                    @click.stop="onDelete(file)"
                  >
                    <Trash2 class="mr-2 h-4 w-4" />
                    Kalıcı Olarak Sil
                  </DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
