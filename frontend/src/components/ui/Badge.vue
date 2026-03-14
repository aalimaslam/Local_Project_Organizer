<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary': return 'border-transparent bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
    case 'destructive': return 'border-transparent bg-red-600 text-white hover:bg-red-700'
    case 'outline': return 'border-gray-300 text-gray-800 dark:border-gray-700 dark:text-gray-100'
    default: return 'border-transparent bg-blue-700 text-white dark:bg-blue-500 dark:text-gray-950'
  }
})
</script>

<template>
  <div
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-blue-400"
    :class="[variantClasses]"
  >
    <slot />
  </div>
</template>
