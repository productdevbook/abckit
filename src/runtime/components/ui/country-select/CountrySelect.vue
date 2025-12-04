<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { FormControl } from 'abckit/shadcn/form'
import { useCountries } from './useCountries'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  locale?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select country...',
  disabled: false,
  locale: 'tr',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Use countries utilities
const { getAllCountries } = useCountries(props.locale)

// Get all countries formatted for select options
const formattedCountries = computed(() => {
  return getAllCountries()
})

// Select element reference
const selectRef = ref<HTMLSelectElement>()

// Ensure select value is set correctly after options are rendered
watch(() => formattedCountries.value, async () => {
  if (props.modelValue && formattedCountries.value.length > 0) {
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
          v-for="{ value, label } in formattedCountries" 
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
          <option value="TR">🇹🇷 Türkiye</option>
          <option value="US">🇺🇸 United States</option>
          <option value="GB">🇬🇧 United Kingdom</option>
          <option value="DE">🇩🇪 Germany</option>
          <option value="FR">🇫🇷 France</option>
        </select>
      </template>
    </ClientOnly>
  </FormControl>
</template>