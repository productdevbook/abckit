<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { FormControl } from 'abckit/shadcn/form'
import { useCurrencies } from './useCurrencies'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  displayLocale?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select currency...',
  disabled: false,
  displayLocale: 'tr',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Use currencies utilities
const { getAllCurrencies } = useCurrencies(props.displayLocale)

// Get all currencies formatted for select options
const formattedCurrencies = computed(() => {
  return getAllCurrencies()
})

// Select element reference
const selectRef = ref<HTMLSelectElement>()

// Ensure select value is set correctly after options are rendered
watch(() => formattedCurrencies.value, async () => {
  if (props.modelValue && formattedCurrencies.value.length > 0) {
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
          v-for="{ value, label } in formattedCurrencies" 
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
          <option value="TRY">₺ Türk Lirası (TRY)</option>
          <option value="USD">$ US Dollar (USD)</option>
          <option value="EUR">€ Euro (EUR)</option>
          <option value="GBP">£ British Pound (GBP)</option>
          <option value="JPY">¥ Japanese Yen (JPY)</option>
        </select>
      </template>
    </ClientOnly>
  </FormControl>
</template>