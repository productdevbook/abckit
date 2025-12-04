<script setup lang="ts">
import { Cloud, Trash2 } from 'lucide-vue-next'

interface Props {
  searchQuery?: string
  isTrash?: boolean
  onUploadClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  isTrash: false,
})

const emit = defineEmits<{
  uploadClick: []
}>()

function handleUploadClick() {
  if (props.onUploadClick) {
    props.onUploadClick()
  }
  else {
    emit('uploadClick')
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div
      v-if="!isTrash && !searchQuery"
      class="relative rounded-full bg-muted p-8 mb-4 cursor-pointer transition-transform hover:scale-105"
      @click="handleUploadClick"
    >
      <Cloud class="h-16 w-16 text-muted-foreground" />
      <input
        v-if="!onUploadClick"
        type="file"
        multiple
        class="absolute inset-0 cursor-pointer opacity-0"
        @change="$emit('uploadClick')"
      />
    </div>
    <div v-else-if="!searchQuery" class="rounded-full bg-muted p-8 mb-4">
      <Trash2 class="h-16 w-16 text-muted-foreground" />
    </div>
    <div v-else class="rounded-full bg-muted p-8 mb-4">
      <Icon name="lucide:search-x" class="h-16 w-16 text-muted-foreground" />
    </div>

    <h3 class="text-lg font-semibold">
      <template v-if="searchQuery">
        Sonuç bulunamadı
      </template>
      <template v-else-if="!isTrash">
        Henüz dosya yok
      </template>
      <template v-else>
        Çöp kutusu boş
      </template>
    </h3>

    <p class="text-muted-foreground mt-1">
      <template v-if="searchQuery">
        Farklı bir arama terimi deneyin
      </template>
      <template v-else-if="!isTrash">
        Dosyaları sürükleyip bırakın veya yükle butonunu kullanın
      </template>
      <template v-else>
        Silinen dosyalar burada görünecek
      </template>
    </p>
  </div>
</template>
