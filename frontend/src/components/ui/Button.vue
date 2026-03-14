<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'destructive': return 'bg-red-600 text-white hover:bg-red-700'
    case 'outline': return 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'
    case 'secondary': return 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
    case 'ghost': return 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-50'
    case 'link': return 'text-blue-700 underline-offset-4 hover:underline dark:text-blue-300'
    default: return 'bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-500 dark:text-gray-950 dark:hover:bg-blue-400'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-9 px-3 text-xs'
    case 'lg': return 'h-11 px-8'
    case 'icon': return 'h-10 w-10'
    default: return 'h-10 px-4 py-2'
  }
})
</script>

<template>
  <button
    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-400"
    :class="[variantClasses, sizeClasses]"
  >
    <slot />
  </button>
</template>
