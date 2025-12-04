<script setup lang="ts">
import { Button } from 'abckit/shadcn/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from 'abckit/shadcn/drawer'
import { Icon } from '#components'
import { ref } from 'vue'

interface FolderPathItem {
  id: string
  originalName: string
}

interface Props {
  folderPath?: FolderPathItem[]
  currentFolderId?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  navigateToRoot: []
  navigateToFolder: [folderId: string]
}>()

const isDrawerOpen = ref(false)
</script>

<template>
  <nav
    v-if="currentFolderId || folderPath?.length"
    class="flex items-center gap-2 text-sm py-3"
    aria-label="Breadcrumb"
  >
    <!-- Home -->
    <Button
      variant="ghost"
      size="sm"
      class="h-8 px-3 text-muted-foreground hover:text-foreground flex-shrink-0"
      @click="emit('navigateToRoot')"
    >
      <Icon name="lucide:home" class="h-4 w-4" />
      <span class="ml-2 text-sm hidden sm:inline">Ana Klasör</span>
    </Button>

    <!-- Folder Path -->
    <template v-if="folderPath?.length">
      <!-- Desktop: Show breadcrumb path -->
      <div class="hidden sm:contents">
        <!-- Show first folders -->
        <template v-for="(folder, index) in folderPath.slice(0, 2)" :key="`desktop-${folder.id}`">
          <Icon name="lucide:chevron-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          
          <Button
            v-if="index < folderPath.length - 1"
            variant="ghost"
            size="sm"
            class="h-8 px-3 text-muted-foreground hover:text-foreground max-w-[140px]"
            @click="emit('navigateToFolder', folder.id)"
          >
            <Icon name="lucide:folder" class="h-4 w-4 mr-2 flex-shrink-0" />
            <span class="truncate text-sm">{{ folder.originalName }}</span>
          </Button>
          
          <div
            v-else
            class="flex items-center px-3 py-1.5 text-foreground font-medium max-w-[160px]"
          >
            <Icon name="lucide:folder-open" class="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
            <span class="truncate text-sm">{{ folder.originalName }}</span>
          </div>
        </template>

        <!-- Show drawer trigger for middle folders if path is long -->
        <template v-if="folderPath.length > 3">
          <Icon name="lucide:chevron-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          
          <button 
            class="inline-flex items-center justify-center h-6 px-2 text-xs font-semibold text-white bg-muted-foreground hover:bg-foreground rounded transition-colors min-w-[24px]"
            @click="isDrawerOpen = true"
          >
            +{{ folderPath.slice(2, -1).length }}
          </button>
        </template>

        <!-- Show last folder -->
        <template v-if="folderPath.length > 2">
          <Icon name="lucide:chevron-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
          
          <div class="flex items-center px-3 py-1.5 text-foreground font-medium max-w-[160px]">
            <Icon name="lucide:folder-open" class="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
            <span class="truncate text-sm">{{ folderPath?.[folderPath.length - 1]?.originalName }}</span>
          </div>
        </template>
      </div>

      <!-- Mobile: Show folder count button -->
      <div class="contents sm:hidden">
        <Icon name="lucide:chevron-right" class="h-3 w-3 text-muted-foreground flex-shrink-0" />
        
        <button 
          class="inline-flex items-center justify-center h-6 px-2 text-xs font-semibold text-white bg-muted-foreground hover:bg-foreground rounded transition-colors min-w-[20px]"
          @click="isDrawerOpen = true"
        >
          {{ folderPath.length }}
        </button>

        <Icon name="lucide:chevron-right" class="h-3 w-3 text-muted-foreground flex-shrink-0" />
        
        <div class="flex items-center px-2 py-1 text-foreground font-medium max-w-[120px] flex-shrink-0">
          <Icon name="lucide:folder-open" class="h-3 w-3 mr-1 flex-shrink-0 text-primary" />
          <span class="truncate text-xs">{{ folderPath?.[folderPath.length - 1]?.originalName }}</span>
        </div>
      </div>
    </template>

    <!-- Single responsive drawer -->
    <Drawer v-model:open="isDrawerOpen">
      <DrawerContent class="max-h-[80vh] sm:max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Klasör Yolu</DrawerTitle>
          <DrawerDescription>
            {{ folderPath?.length || 0 }} seviye klasör hiyerarşisi
          </DrawerDescription>
        </DrawerHeader>
        
        <div class="px-3 pb-3 overflow-y-auto">
          <div class="space-y-1">
            <!-- Home folder -->
            <button
              @click="emit('navigateToRoot'); isDrawerOpen = false"
              class="w-full flex items-center gap-3 px-3 py-3 sm:py-2 text-left hover:bg-muted/50 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
            >
              <div class="h-7 w-7 sm:h-6 sm:w-6 rounded bg-primary/10 flex items-center justify-center">
                <Icon name="lucide:home" class="h-4 w-4 sm:h-3.5 sm:w-3.5 text-primary" />
              </div>
              <p class="font-medium text-base sm:text-sm">Ana Klasör</p>
            </button>
            
            <!-- Hierarchical folder structure -->
            <div class="relative">
              <!-- Vertical line for hierarchy -->
              <div class="absolute left-5 sm:left-4 top-0 bottom-0 w-px bg-border/60"></div>
              
              <div class="space-y-1">
                <button
                  v-for="(folder, index) in folderPath || []"
                  :key="folder.id"
                  @click="emit('navigateToFolder', folder.id); isDrawerOpen = false"
                  class="w-full flex items-center gap-3 sm:gap-2 text-left hover:bg-muted/50 rounded-lg sm:rounded-md transition-colors group relative min-h-[44px] sm:min-h-0 py-3 px-3 sm:py-1.5 sm:px-2"
                  :class="{ 'bg-primary/5': index === (folderPath?.length ?? 0) - 1 }"
                  :style="{ 
                    paddingLeft: `${12 + (index + 1) * 10}px`
                  }"
                >
                  <!-- Hierarchy connector -->
                  <div 
                    class="absolute bg-border/60" 
                    :style="{ 
                      left: `${12 + (index + 1) * 10 - 8}px`, 
                      top: '50%', 
                      width: '8px', 
                      height: '1px' 
                    }"
                  ></div>
                  
                  <!-- Folder icon -->
                  <div class="h-6 w-6 sm:h-5 sm:w-5 rounded bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Icon 
                      :name="index === (folderPath?.length ?? 0) - 1 ? 'lucide:folder-open' : 'lucide:folder'" 
                      class="h-4 w-4 sm:h-3 sm:w-3"
                      :class="index === (folderPath?.length ?? 0) - 1 ? 'text-primary' : 'text-amber-600'"
                    />
                  </div>
                  
                  <!-- Folder info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-base sm:text-xs truncate" :class="{ 'text-primary': index === (folderPath?.length ?? 0) - 1 }">
                      {{ folder.originalName }}
                    </p>
                  </div>
                  
                  <!-- Current indicator -->
                  <Icon 
                    v-if="index === (folderPath?.length ?? 0) - 1" 
                    name="lucide:circle-dot" 
                    class="h-4 w-4 sm:h-3 sm:w-3 text-primary flex-shrink-0" 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  </nav>
</template>