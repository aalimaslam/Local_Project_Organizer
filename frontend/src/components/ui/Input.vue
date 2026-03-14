<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <input
    :id="id"
    :type="type || 'text'"
    :placeholder="placeholder"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400"
  />
</template>
