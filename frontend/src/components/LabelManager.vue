<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Trash2, Tag } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import Dialog from './ui/Dialog.vue'
import type { Label } from '../services/api'
import { createLabel, deleteLabel } from '../services/api'

const props = defineProps<{
  open: boolean
  labels: Label[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'changed'): void
}>()

const newName = ref('')
const newColor = ref('#6366f1')
const loading = ref(false)

const PRESET_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ef4444',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#6b7280'
]

const handleAdd = async () => {
  if (!newName.value.trim()) return
  loading.value = true
  try {
    await createLabel(newName.value.trim(), newColor.value)
    newName.value = ''
    newColor.value = '#6366f1'
    emit('changed')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string) => {
  await deleteLabel(id)
  emit('changed')
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-5 w-full max-w-sm">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-gray-100">Manage Labels</h2>
        <p class="text-sm text-gray-400">Create and delete labels for projects and notes.</p>
      </div>

      <!-- Existing labels -->
      <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
        <div
          v-for="label in labels"
          :key="label.id"
          class="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 group"
        >
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full flex-shrink-0" :style="{ backgroundColor: label.color }" />
            <span class="text-sm text-gray-200">{{ label.name }}</span>
          </div>
          <button
            @click="handleDelete(label.id)"
            class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
        <div v-if="labels.length === 0" class="text-sm text-gray-500 text-center py-4">No labels yet</div>
      </div>

      <!-- Add new label -->
      <div class="space-y-3 pt-3 border-t border-gray-700">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add New Label</p>
        <div class="flex gap-2">
          <input
            v-model="newName"
            type="text"
            placeholder="Label name"
            class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keydown.enter="handleAdd"
          />
          <input
            v-model="newColor"
            type="color"
            class="h-10 w-10 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer p-1"
          />
        </div>
        <!-- Color presets -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="color in PRESET_COLORS"
            :key="color"
            @click="newColor = color"
            class="h-6 w-6 rounded-full transition-transform hover:scale-110 ring-offset-gray-900"
            :class="newColor === color ? 'ring-2 ring-white ring-offset-2' : ''"
            :style="{ backgroundColor: color }"
          />
        </div>
        <Button @click="handleAdd" :disabled="loading || !newName.trim()" class="w-full" size="sm">
          <Plus class="mr-2 h-3.5 w-3.5" />
          Add Label
        </Button>
      </div>

      <div class="flex justify-end pt-2">
        <Button variant="outline" @click="$emit('update:open', false)">Close</Button>
      </div>
    </div>
  </Dialog>
</template>
