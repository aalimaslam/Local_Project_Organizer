<script setup lang="ts">
import { ref, computed } from 'vue'
import { FolderSearch, Loader2, Sparkles, CheckCircle2, CheckSquare, Square, Zap } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import Button from './ui/Button.vue'
import { scanDirectory, analyzeProject, analyzeProjectsBulk, addProject, type ScanResult } from '../services/api'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'added'): void
}>()

const parentPath = ref('')
const scanning = ref(false)
const groupName = ref('')
const bulkAnalyzing = ref(false)
const analyzeProgress = ref(0)

type DirEntry = ScanResult & {
  selected: boolean
  analyzed: boolean
  analyzing: boolean
  result?: {
    name: string
    description: string
    startCommand: string
    tags: string[]
    labels: string[]
  }
}

const directories = ref<DirEntry[]>([])

const allSelected = computed(() => directories.value.length > 0 && directories.value.every(d => d.selected))
const someSelected = computed(() => directories.value.some(d => d.selected))
const selectedCount = computed(() => directories.value.filter(d => d.selected).length)
const analyzedCount = computed(() => directories.value.filter(d => d.analyzed).length)

const toggleAll = () => {
  const val = !allSelected.value
  directories.value.forEach(d => (d.selected = val))
}

const handleScan = async () => {
  if (!parentPath.value) return
  scanning.value = true
  groupName.value = parentPath.value.split(/[\\/]/).pop() || ''
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

const handleAnalyze = async (dir: DirEntry) => {
  dir.analyzing = true
  try {
    const result = await analyzeProject(dir.path)
    dir.result = result
    dir.analyzed = true
  } catch (error) {
    console.error('Analysis failed for', dir.name)
  } finally {
    dir.analyzing = false
  }
}

// Analyze all selected in a single batch
const handleAnalyzeAll = async () => {
  const selected = directories.value.filter(d => d.selected && !d.analyzed)
  if (selected.length === 0) return
  bulkAnalyzing.value = true
  analyzeProgress.value = 0

  try {
    const paths = selected.map(s => s.path)
    selected.forEach(s => s.analyzing = true)
    
    analyzeProgress.value = 20
    const results = await analyzeProjectsBulk(paths)
    analyzeProgress.value = 80
    
    results.forEach((res, i) => {
      const dir = selected[i]
      if (dir) {
        dir.result = res
        dir.analyzed = true
      }
    })
    analyzeProgress.value = 100
  } catch (error: any) {
    console.error('Bulk analysis failed', error)
    alert('Bulk AI Analysis failed: ' + error.message)
  } finally {
    selected.forEach(s => s.analyzing = false)
    bulkAnalyzing.value = false
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
        labels: dir.result?.labels || [],
        startCommand: dir.result?.startCommand || '',
        pinned: false,
        groupName: groupName.value || null,
      })
    } catch (error) {
      console.error(`Failed to add project ${dir.name}`, error)
    }
  }

  emit('added')
  emit('update:open', false)
  directories.value = []
  parentPath.value = ''
  groupName.value = ''
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-5 max-w-2xl w-full">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-gray-100">Bulk Add Projects</h2>
        <p class="text-sm text-gray-400">Scan a directory, let AI auto-fill details, and add multiple projects at once.</p>
      </div>

      <!-- Path input -->
      <div class="flex gap-2">
        <div class="flex-1">
          <Input v-model="parentPath" placeholder="Enter parent directory (e.g. D:\projects)" @keyup.enter="handleScan" />
        </div>
        <Button @click="handleScan" :disabled="scanning">
          <Loader2 v-if="scanning" class="mr-2 h-4 w-4 animate-spin" />
          <FolderSearch v-else class="mr-2 h-4 w-4" />
          Scan
        </Button>
      </div>

      <!-- Group name -->
      <div v-if="directories.length > 0" class="space-y-1">
        <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group Name</label>
        <Input v-model="groupName" placeholder="Group name for these projects" />
      </div>

      <!-- Directory list -->
      <div v-if="directories.length > 0" class="border border-gray-700 rounded-xl overflow-hidden">
        <!-- Toolbar -->
        <div class="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-b border-gray-700 gap-2">
          <button @click="toggleAll" class="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <component :is="allSelected ? CheckSquare : Square" class="h-4 w-4" :class="allSelected ? 'text-indigo-400' : 'text-gray-500'" />
            {{ allSelected ? 'Deselect All' : 'Select All' }}
          </button>

          <div class="flex items-center gap-2">
            <!-- Progress -->
            <span v-if="bulkAnalyzing" class="text-xs text-indigo-300">
              Analyzing... {{ analyzeProgress }}%
            </span>
            <span v-else-if="analyzedCount > 0" class="text-xs text-emerald-400">
              {{ analyzedCount }}/{{ selectedCount }} analyzed
            </span>

            <!-- Analyze All Selected -->
            <Button
              size="sm"
              variant="ghost"
              @click="handleAnalyzeAll"
              :disabled="bulkAnalyzing || !someSelected"
              title="AI analyze all selected"
              class="gap-1.5 text-indigo-400 hover:text-indigo-300"
            >
              <Loader2 v-if="bulkAnalyzing" class="h-3.5 w-3.5 animate-spin" />
              <Zap v-else class="h-3.5 w-3.5" />
              AI Fill All
            </Button>
          </div>

          <span class="text-xs text-gray-400 ml-auto">{{ selectedCount }}/{{ directories.length }}</span>
        </div>

        <!-- Progress bar -->
        <div v-if="bulkAnalyzing" class="h-0.5 bg-gray-700">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" :style="{ width: analyzeProgress + '%' }" />
        </div>

        <div class="max-h-72 overflow-y-auto divide-y divide-gray-800">
          <div
            v-for="dir in directories"
            :key="dir.path"
            class="flex items-center justify-between px-3 py-2.5 hover:bg-gray-800/40 transition-colors cursor-pointer"
            @click="dir.selected = !dir.selected"
          >
            <div class="flex items-center gap-3 min-w-0">
              <component
                :is="dir.selected ? CheckSquare : Square"
                class="h-4 w-4 flex-shrink-0 transition-colors"
                :class="dir.selected ? 'text-indigo-400' : 'text-gray-600'"
              />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-200 truncate">
                  {{ dir.result?.name || dir.name }}
                </p>
                <p v-if="dir.result?.description" class="text-[10px] text-gray-400 truncate">{{ dir.result.description }}</p>
                <p v-else class="text-[10px] text-gray-500 font-mono truncate max-w-xs">{{ dir.path }}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-if="dir.result?.startCommand" class="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded px-1 py-0.5 font-mono">
                    $ {{ dir.result.startCommand }}
                  </span>
                  <span v-for="tag in (dir.result?.tags || [])" :key="tag" class="text-[9px] bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 rounded px-1 py-0.5">{{ tag }}</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              @click.stop="handleAnalyze(dir)"
              :disabled="dir.analyzing || dir.analyzed"
              class="flex-shrink-0 ml-2"
              title="AI Analyze this project"
            >
              <Loader2 v-if="dir.analyzing" class="h-4 w-4 animate-spin text-indigo-400" />
              <Sparkles v-else-if="!dir.analyzed" class="h-4 w-4 text-indigo-400" />
              <CheckCircle2 v-else class="h-4 w-4 text-emerald-400" />
            </Button>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center pt-2">
        <div class="text-xs text-gray-500" v-if="analyzedCount > 0">
          AI filled {{ analyzedCount }} project{{ analyzedCount !== 1 ? 's' : '' }} with descriptions, tags &amp; labels
        </div>
        <div class="flex gap-3 ml-auto">
          <Button variant="outline" type="button" @click="$emit('update:open', false)">Cancel</Button>
          <Button @click="handleBulkAdd" :disabled="!someSelected">
            Add Selected ({{ selectedCount }})
          </Button>
        </div>
      </div>
    </div>
  </Dialog>
</template>
