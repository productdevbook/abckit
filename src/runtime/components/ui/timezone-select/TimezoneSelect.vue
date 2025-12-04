<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { FormControl } from 'abckit/shadcn/form'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select timezone...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()



// Country mapping for better display names
const countryMapping: Record<string, string> = {
  'Europe/Istanbul': 'Turkey',
  'Europe/London': 'United Kingdom',
  'Europe/Berlin': 'Germany', 
  'America/New_York': 'United States (Eastern)',
  'America/Los_Angeles': 'United States (Pacific)',
  'Asia/Tokyo': 'Japan',
  'Asia/Shanghai': 'China',
  'Australia/Sydney': 'Australia'
}

// Get all timezones formatted exactly like your example
const formattedTimezones = computed(() => {
  try {
    const timezones = Intl.supportedValuesOf('timeZone')
    
    return timezones
      .map((timezone: string) => {
        const formatter = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'shortOffset'
        })
        const parts = formatter.formatToParts(new Date())
        const offset = parts.find(part => part.type === 'timeZoneName')?.value || ''
        const modifiedOffset = offset === 'GMT' ? 'GMT+0' : offset
        
        const label = timezone.replace(/_/g, ' ')
        const country = countryMapping[timezone]
        const displayLabel = country ? `${label} - ${country}` : label
        
        return {
          value: timezone,
          label: `(${modifiedOffset}) ${displayLabel}`,
          numericOffset: getNumericOffset(offset)
        }
      })
      .sort((a, b) => {
        // Sort by numeric offset only (GMT-12 to GMT+12)
        return a.numericOffset - b.numericOffset
      })
  } catch {
    // Fallback for older browsers
    return [{
      value: 'UTC',
      label: '(GMT+0) UTC',
      numericOffset: 0
    }]
  }
})

// Helper function to get numeric offset for sorting
function getNumericOffset(offset: string): number {
  if (!offset || offset === 'GMT') return 0

  const match = offset.match(/GMT([+-]?\d+)/)
  if (match && match[1] !== undefined) {
    return parseInt(match[1]) || 0
  }

  return 0
}

// Select element reference
const selectRef = ref<HTMLSelectElement>()

// Ensure select value is set correctly after options are rendered
watch(() => formattedTimezones.value, async () => {
  if (props.modelValue && formattedTimezones.value.length > 0) {
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
    <select
      ref="selectRef"
      :value="modelValue"
      :disabled="disabled"
      @change="(event) => emit('update:modelValue', (event.target as HTMLSelectElement).value)"
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option 
        v-for="{ value, label } in formattedTimezones" 
        :key="value" 
        :value="value"
      >
        {{ label }}
      </option>
    </select>
  </FormControl>
</template>