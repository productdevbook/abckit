<script setup lang="ts">
import { Cloud, Trash2, Upload } from 'lucide-vue-next'
import { Icon } from '#components'
import { ref } from 'vue'

interface Props {
  type?: 'empty' | 'search' | 'trash'
  searchQuery?: string
  showUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'empty',
  showUpload: false,
})

const emit = defineEmits<{
  upload: [files: FileList]
}>()

const fileInputRef = ref<HTMLInputElement>()

function handleUploadClick() {
  fileInputRef.value?.click()
}

function handleFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    emit('upload', target.files)
    target.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <!-- Icon -->
    <div class="rounded-full bg-muted p-8 mb-4" :class="{ 'cursor-pointer': showUpload }" @click="showUpload ? handleUploadClick() : undefined">
      <input
        v-if="showUpload"
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileInput"
      >
      <Upload v-if="type === 'empty' && showUpload" class="h-16 w-16 text-muted-foreground" />
      <Cloud v-else-if="type === 'empty'" class="h-16 w-16 text-muted-foreground" />
      <Trash2 v-else-if="type === 'trash'" class="h-16 w-16 text-muted-foreground" />
      <Icon v-else name="lucide:search-x" class="h-16 w-16 text-muted-foreground" />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold">
      <template v-if="type === 'search'">
        Sonuç bulunamadı
      </template>
      <template v-else-if="type === 'empty'">
        Henüz dosya yok
      </template>
      <template v-else-if="type === 'trash'">
        Çöp kutusu boş
      </template>
    </h3>

    <!-- Description -->
    <p class="text-muted-foreground mt-1">
      <template v-if="type === 'search'">
        {{ searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : 'Farklı bir arama terimi deneyin' }}
      </template>
      <template v-else-if="type === 'empty'">
        {{ showUpload ? 'Dosyaları sürükleyip bırakın veya yükle butonunu kullanın' : 'Dosya yüklemek için yükle butonunu kullanın' }}
      </template>
      <template v-else-if="type === 'trash'">
        Silinen dosyalar burada görünecek
      </template>
    </p>
  </div>
</template>