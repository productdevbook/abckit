<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { FormControl } from 'abckit/shadcn/form'
import { useLanguages } from './useLanguages'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  displayLocale?: string
  showAllLanguages?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select language...',
  disabled: false,
  displayLocale: 'tr',
  showAllLanguages: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Use languages utilities
const { getAllLanguages } = useLanguages(props.displayLocale, props.showAllLanguages)

// Get all languages formatted for select options
const formattedLanguages = computed(() => {
  return getAllLanguages()
})

// Select element reference
const selectRef = ref<HTMLSelectElement>()

// Ensure select value is set correctly after options are rendered
watch(() => formattedLanguages.value, async () => {
  if (props.modelValue && formattedLanguages.value.length > 0) {
    // Wait for DOM options to be fully rendered
    await nextTick()
    await nextTick()
    
    // Force select value if ref is available
    if (selectRef.value) {
      selectRef.value.value = props.modelValue
    }
  }
}, { immediate: true })
</script>

<template>
  <FormControl>
    <ClientOnly>
      <select
        ref="selectRef"
        :value="modelValue"
        :disabled="disabled"
        @change="(event) => emit('update:modelValue', (event.target as HTMLSelectElement).value)"
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option 
          v-for="{ value, label } in formattedLanguages" 
          :key="value" 
          :value="value"
        >
          {{ label }}
        </option>
      </select>
      <template #fallback>
        <select
          :value="modelValue"
          :disabled="disabled"
          @change="(event) => emit('update:modelValue', (event.target as HTMLSelectElement).value)"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>{{ placeholder }}</option>
          <option value="tr">Türkçe (Turkish)</option>
          <option value="en">English</option>
          <option value="es">Español (Spanish)</option>
          <option value="fr">Français (French)</option>
          <option value="de">Deutsch (German)</option>
        </select>
      </template>
    </ClientOnly>
  </FormControl>
</template>