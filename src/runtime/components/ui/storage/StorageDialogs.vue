<script setup lang="ts">
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from 'abckit/shadcn/alert-dialog'
import { Button } from 'abckit/shadcn/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'abckit/shadcn/dialog'
import { Input } from 'abckit/shadcn/input'
import { Label } from 'abckit/shadcn/label'
import { RadioGroup, RadioGroupItem } from 'abckit/shadcn/radio-group'
import { Icon } from '#components'
import { computed, ref, watch } from 'vue'

interface DeleteTarget {
  id: string
  type: 'single' | 'multiple'
  isFolder?: boolean
}

interface RenameTarget {
  id: string
  currentName: string
  isFolder?: boolean
}

interface MoveTarget {
  id: string
  name: string
  currentParentId?: string | null
}

interface Props {
  // Delete dialog
  showDeleteDialog: boolean
  deleteTarget?: DeleteTarget | null
  isTrash?: boolean
  selectedCount?: number

  // Rename dialog  
  showRenameDialog: boolean
  renameTarget?: RenameTarget | null

  // Create folder dialog
  showCreateFolderDialog: boolean

  // Move dialog
  showMoveDialog: boolean
  moveTarget?: MoveTarget | null
  selectedTargetFolderId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isTrash: false,
  selectedCount: 0,
})

const emit = defineEmits<{
  'update:showDeleteDialog': [value: boolean]
  'update:showRenameDialog': [value: boolean] 
  'update:showCreateFolderDialog': [value: boolean]
  'update:showMoveDialog': [value: boolean]
  'update:selectedTargetFolderId': [value: string | undefined]
  'confirm-delete': []
  'confirm-rename': [name: string]
  'confirm-create-folder': [name: string]
  'confirm-move': []
}>()

const newFileName = ref('')
const newFolderName = ref('')

// Reactive models for v-model
const deleteDialogModel = computed({
  get: () => props.showDeleteDialog,
  set: (value: boolean) => emit('update:showDeleteDialog', value)
})

const renameDialogModel = computed({
  get: () => props.showRenameDialog,
  set: (value: boolean) => emit('update:showRenameDialog', value)
})

const createFolderDialogModel = computed({
  get: () => props.showCreateFolderDialog,
  set: (value: boolean) => emit('update:showCreateFolderDialog', value)
})

const moveDialogModel = computed({
  get: () => props.showMoveDialog,
  set: (value: boolean) => emit('update:showMoveDialog', value)
})

const selectedTargetFolderModel = computed({
  get: () => props.selectedTargetFolderId,
  set: (value: string | undefined) => emit('update:selectedTargetFolderId', value)
})

// Watch for rename target changes
watch(() => props.renameTarget, (target) => {
  if (target) {
    newFileName.value = target.currentName
  }
}, { immediate: true })

// Reset values when dialogs close
watch([renameDialogModel, createFolderDialogModel], ([renameOpen, createOpen]) => {
  if (!renameOpen) newFileName.value = ''
  if (!createOpen) newFolderName.value = ''
})

function handleRename() {
  if (newFileName.value.trim()) {
    emit('confirm-rename', newFileName.value.trim())
  }
}

function handleCreateFolder() {
  if (newFolderName.value.trim()) {
    emit('confirm-create-folder', newFolderName.value.trim())
  }
}
</script>

<template>
  <!-- Delete Confirmation Dialog -->
  <AlertDialog v-model:open="deleteDialogModel">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ isTrash ? 'Kalıcı Olarak Sil' : 'Dosyayı Sil' }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <template v-if="deleteTarget?.type === 'single'">
            Bu {{ deleteTarget?.isFolder ? 'klasörü' : 'dosyayı' }} 
            {{ isTrash ? 'kalıcı olarak silmek' : 'çöp kutusuna taşımak' }} istediğinize emin misiniz?
            {{ isTrash ? 'Bu işlem geri alınamaz.' : '' }}
          </template>
          <template v-else>
            {{ selectedCount }} dosyayı {{ isTrash ? 'kalıcı olarak silmek' : 'çöp kutusuna taşımak' }} istediğinize emin misiniz?
            {{ isTrash ? 'Bu işlem geri alınamaz.' : '' }}
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>İptal</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-white hover:bg-destructive/90"
          @click="emit('confirm-delete')"
        >
          {{ isTrash ? 'Kalıcı Olarak Sil' : 'Sil' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Rename Dialog -->
  <Dialog v-model:open="renameDialogModel">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ renameTarget?.isFolder ? 'Klasörü' : 'Dosyayı' }} Yeniden Adlandır</DialogTitle>
        <DialogDescription>
          {{ renameTarget?.isFolder ? 'Klasör' : 'Dosya' }} için yeni bir isim girin.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="new-name">{{ renameTarget?.isFolder ? 'Klasör' : 'Dosya' }} Adı</Label>
          <Input
            id="new-name"
            v-model="newFileName"
            :placeholder="`Yeni ${renameTarget?.isFolder ? 'klasör' : 'dosya'} adı`"
            @keyup.enter="handleRename"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="renameDialogModel = false">
          İptal
        </Button>
        <Button @click="handleRename">
          Kaydet
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Move Dialog -->
  <Dialog v-model:open="moveDialogModel">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dosyayı Taşı</DialogTitle>
        <DialogDescription>
          "{{ moveTarget?.name }}" dosyasını taşımak istediğiniz klasörü seçin.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <RadioGroup v-model="selectedTargetFolderModel" class="space-y-2">
          <div class="flex items-center space-x-2 p-2 rounded hover:bg-muted">
            <RadioGroupItem value="" />
            <Label for="root-folder" class="flex items-center gap-2 cursor-pointer flex-1">
              <Icon name="lucide:home" class="h-4 w-4" />
              Ana Klasör
            </Label>
          </div>
          <slot name="folder-tree" />
        </RadioGroup>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="moveDialogModel = false">
          İptal
        </Button>
        <Button @click="emit('confirm-move')">
          Taşı
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Create Folder Dialog -->
  <Dialog v-model:open="createFolderDialogModel">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Yeni Klasör Oluştur</DialogTitle>
        <DialogDescription>
          Klasör için bir isim girin.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="folder-name">Klasör Adı</Label>
          <Input
            id="folder-name"
            v-model="newFolderName"
            placeholder="Yeni klasör"
            @keyup.enter="handleCreateFolder"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="createFolderDialogModel = false">
          İptal
        </Button>
        <Button @click="handleCreateFolder">
          Oluştur
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>