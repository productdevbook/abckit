<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  isDragging?: boolean
  isUploading?: boolean
  fileTypeLabel?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  isUploading: false,
  multiple: true,
  disabled: false,
})

const emit = defineEmits<{
  upload: [files: FileList]
  click: []
}>()

const fileInputRef = ref<HTMLInputElement>()

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    emit('upload', target.files)
    target.value = ''
  }
}

function handleClick() {
  if (!props.disabled && !props.isUploading) {
    fileInputRef.value?.click()
    emit('click')
  }
}
</script>

<template>
  <div
    class="relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer"
    :class="[
      isDragging
        ? 'border-primary bg-primary/5 scale-[0.98]'
        : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/5',
      disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
    @click="handleClick"
  >
    <input
      ref="fileInputRef"
      type="file"
      :multiple="multiple"
      :accept="accept"
      :disabled="disabled || isUploading"
      class="hidden"
      @change="handleFileInput"
    >
    
    <Upload 
      class="mx-auto h-10 w-10 transition-colors" 
      :class="isDragging ? 'text-primary' : 'text-muted-foreground'" 
    />
    
    <p class="mt-3 text-base font-medium transition-colors" :class="isDragging ? 'text-primary' : 'text-foreground'">
      <template v-if="isUploading">
        Dosyalar yükleniyor...
      </template>
      <template v-else-if="isDragging">
        Dosyaları bırakın
      </template>
      <template v-else>
        Dosya yüklemek için tıklayın veya sürükleyin
      </template>
    </p>
    
    <p class="text-sm transition-colors mt-1" :class="isDragging ? 'text-primary/80' : 'text-muted-foreground'">
      {{ fileTypeLabel || 'Tüm dosya türleri kabul edilir' }}
    </p>
  </div>
</template>