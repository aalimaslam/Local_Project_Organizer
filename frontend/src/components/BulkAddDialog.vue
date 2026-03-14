<script setup lang="ts">
import { ref } from 'vue'
import { FolderSearch, Loader2, Sparkles, CheckCircle2 } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import Label from './ui/Label.vue'
import Button from './ui/Button.vue'
import { scanDirectory, analyzeProject, addProject, type ScanResult } from '../services/api'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'added'): void
}>()

const parentPath = ref('')
const scanning = ref(false)
const directories = ref<(ScanResult & { selected: boolean; analyzed: boolean; analyzing: boolean; result?: any })[]>([])

const handleScan = async () => {
  if (!parentPath.value) return
  scanning.value = true
  try {
    const results = await scanDirectory(parentPath.value)
    directories.value = results.map(d => ({
      ...d,
      selected: false,
      analyzed: false,
      analyzing: false
    }))
  } catch (error) {
    console.error('Scan failed', error)
    alert('Failed to scan directory')
  } finally {
    scanning.value = false
  }
}

const handleAnalyze = async (dir: any) => {
  dir.analyzing = true
  try {
    const result = await analyzeProject(dir.path)
    dir.result = result
    dir.analyzed = true
  } catch (error) {
    console.error('Analysis failed', error)
  } finally {
    dir.analyzing = false
  }
}

const handleBulkAdd = async () => {
  const selected = directories.value.filter(d => d.selected)
  if (selected.length === 0) return

  for (const dir of selected) {
    try {
      await addProject({
        name: dir.result?.name || dir.name,
        description: dir.result?.description || '',
        path: dir.path,
        tags: dir.result?.tags || [],
        startCommand: dir.result?.startCommand || ''
      })
    } catch (error) {
      console.error(`Failed to add project ${dir.name}`, error)
    }
  }

  emit('added')
  emit('update:open', false)
  directories.value = []
  parentPath.value = ''
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6 max-w-2xl w-full">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold dark:text-gray-100">Bulk Add Projects</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Scan a directory for projects and add them in bulk.</p>
      </div>

      <div class="flex gap-2">
        <div class="flex-1">
          <Input v-model="parentPath" placeholder="Enter parent directory path (e.g. D:\projects)" @keyup.enter="handleScan" />
        </div>
        <Button @click="handleScan" :disabled="scanning">
          <Loader2 v-if="scanning" class="mr-2 h-4 w-4 animate-spin" />
          <FolderSearch v-else class="mr-2 h-4 w-4" />
          Scan
        </Button>
      </div>

      <div v-if="directories.length > 0" class="max-h-[400px] overflow-y-auto space-y-2 border rounded-md p-2 dark:border-gray-800">
        <div v-for="dir in directories" :key="dir.path" class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
          <div class="flex items-center gap-3">
            <input type="checkbox" v-model="dir.selected" class="h-4 w-4 rounded border-gray-300" />
            <div>
              <p class="text-sm font-medium">{{ dir.name }}</p>
              <p class="text-xs text-gray-500">{{ dir.path }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button size="sm" variant="ghost" @click="handleAnalyze(dir)" :disabled="dir.analyzing || dir.analyzed">
              <Loader2 v-if="dir.analyzing" class="h-4 w-4 animate-spin" />
              <Sparkles v-else-if="!dir.analyzed" class="h-4 w-4 text-blue-500" />
              <CheckCircle2 v-else class="h-4 w-4 text-green-500" />
            </Button>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" @click="$emit('update:open', false)">Cancel</Button>
        <Button @click="handleBulkAdd" :disabled="!directories.some(d => d.selected)">
          Add Selected ({{ directories.filter(d => d.selected).length }})
        </Button>
      </div>
    </div>
  </Dialog>
</template>
