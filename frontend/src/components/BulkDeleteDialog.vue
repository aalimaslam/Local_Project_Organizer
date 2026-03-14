<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash2, CheckSquare, Square } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Button from './ui/Button.vue'
import { deleteProject } from '../services/api'
import type { Project } from '../services/api'

const props = defineProps<{
  open: boolean
  projects: Project[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'deleted'): void
}>()

const selectedIds = ref<Set<string>>(new Set())
const deleting = ref(false)

const handleOpenChange = (val: boolean) => {
  if (val) {
    selectedIds.value.clear()
  }
  emit('update:open', val)
}

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const toggleAll = () => {
  if (selectedIds.value.size === props.projects.length) {
    selectedIds.value.clear()
  } else {
    props.projects.forEach(p => selectedIds.value.add(p.id))
  }
}

const allSelected = computed(() => selectedIds.value.size === props.projects.length && props.projects.length > 0)

const handleBulkDelete = async () => {
  if (selectedIds.value.size === 0) return
  if (!confirm(`Are you sure you want to delete ${selectedIds.value.size} projects from the dashboard?`)) return
  
  deleting.value = true
  try {
    const promises = Array.from(selectedIds.value).map(id => deleteProject(id))
    await Promise.all(promises)
    emit('deleted')
    handleOpenChange(false)
  } catch (error) {
    console.error('Failed to delete projects', error)
    alert('Failed to delete some projects')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <div class="space-y-5 max-w-2xl w-full">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-red-400 flex items-center gap-2"><Trash2 class="h-5 w-5"/> Bulk Delete Projects</h2>
        <p class="text-sm text-gray-400">Select multiple projects to remove them from your dashboard at once.</p>
      </div>

      <div class="border border-gray-700 rounded-xl overflow-hidden min-h-[100px]">
        <div class="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-b border-gray-700 gap-2">
          <button @click="toggleAll" class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <component :is="allSelected ? CheckSquare : Square" class="h-4 w-4" :class="allSelected ? 'text-red-400' : 'text-gray-500'" />
            {{ allSelected ? 'Deselect All' : 'Select All' }}
          </button>
          <span class="text-xs text-gray-400">{{ selectedIds.size }}/{{ projects.length }} Selected</span>
        </div>

        <div class="max-h-72 overflow-y-auto divide-y divide-gray-800">
          <div v-if="projects.length === 0" class="p-4 text-center text-sm text-gray-500">
            No projects available
          </div>
          <div
            v-for="project in projects"
            :key="project.id"
            class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition-colors cursor-pointer"
            @click="toggleSelection(project.id)"
          >
            <component
              :is="selectedIds.has(project.id) ? CheckSquare : Square"
              class="h-4 w-4 flex-shrink-0 transition-colors"
              :class="selectedIds.has(project.id) ? 'text-red-400' : 'text-gray-600'"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-200 truncate">{{ project.name }}</p>
              <p class="text-[10px] text-gray-500 font-mono truncate max-w-xs">{{ project.path }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" @click="handleOpenChange(false)">Cancel</Button>
        <Button @click="handleBulkDelete" :disabled="selectedIds.size === 0 || deleting" class="bg-red-600 hover:bg-red-500 text-white border-0">
          <span v-if="deleting">Deleting...</span>
          <span v-else>Delete Selected ({{ selectedIds.size }})</span>
        </Button>
      </div>
    </div>
  </Dialog>
</template>
