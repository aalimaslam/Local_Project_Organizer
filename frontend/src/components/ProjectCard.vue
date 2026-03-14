<script setup lang="ts">
import { ref, computed } from 'vue'
import { Play, Code, FolderOpen, Trash2, Pin, PinOff, StickyNote, Tag, Pencil, GitBranch, AlertCircle, FileCode, TriangleAlert } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import CardHeader from './ui/CardHeader.vue'
import CardTitle from './ui/CardTitle.vue'
import CardDescription from './ui/CardDescription.vue'
import CardContent from './ui/CardContent.vue'
import CardFooter from './ui/CardFooter.vue'
import Badge from './ui/Badge.vue'
import Button from './ui/Button.vue'
import { runProject, openVSCode, openFolder, deleteProject, updateProject } from '../services/api'
import type { Project, Label, GitInfo } from '../services/api'

const props = defineProps<{
  project: Project
  labels: Label[]
  git?: GitInfo
  selectable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'deleted', id: string): void
  (e: 'updated', project: Project): void
  (e: 'open-notes', project: Project): void
  (e: 'open-edit', project: Project): void
  (e: 'select', id: string): void
}>()

const TECH_ICONS: Record<string, string> = {
  'vue': 'Vue.js', 'react': 'React', 'node': 'Node.js', 'typescript': 'TypeScript',
  'python': 'Python', 'django': 'Django', 'fastapi': 'FastAPI', 'go': 'Go',
  'rust': 'Rust', 'docker': 'Docker', 'laravel': 'Laravel', 'php': 'PHP'
}

const isHovered = ref(false)

const handleCopyPath = () => {
  navigator.clipboard.writeText(props.project.path)
}

const labelMap = computed(() => {
  const m: Record<string, Label> = {}
  props.labels.forEach(l => (m[l.id] = l))
  return m
})

const projectLabels = computed(() =>
  (props.project.labels || []).map(id => labelMap.value[id]).filter(Boolean)
)

const handleDelete = async () => {
  if (confirm(`Are you sure you want to remove "${props.project.name}" from the dashboard?`)) {
    try {
      await deleteProject(props.project.id)
      emit('deleted', props.project.id)
    } catch (error) {
      console.error(error)
      alert('Failed to delete project')
    }
  }
}

const handleStart = async () => {
  try {
    await runProject(props.project.path, props.project.startCommand)
  } catch (error) {
    console.error(error)
    alert('Failed to start project')
  }
}

const handleOpenVSCode = async () => {
  try {
    await openVSCode(props.project.path)
  } catch (error) {
    console.error(error)
  }
}

const handleOpenFolder = async () => {
  try {
    await openFolder(props.project.path)
  } catch (error) {
    console.error(error)
  }
}

const handleTogglePin = async () => {
  try {
    const updated = await updateProject(props.project.id, { pinned: !props.project.pinned })
    emit('updated', updated)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <Card
    class="flex flex-col h-full group relative transition-all duration-300 overflow-hidden"
    :class="[
      project.pinned ? 'ring-2 ring-indigo-500/60 shadow-indigo-900/20' : '',
      selected ? 'ring-2 ring-emerald-500 bg-emerald-950/20 border-emerald-500/50' : 'hover:bg-gray-900/40'
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Selection Checkbox -->
    <div 
      v-if="selectable"
      @click.stop="emit('select', project.id)"
      class="absolute top-3 left-3 z-20 h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
      :class="selected ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-800 border-gray-700 hover:border-emerald-500/50'"
    >
      <CheckSquare v-if="selected" class="h-4 w-4 text-white" />
    </div>

    <!-- Pin badge -->
    <div v-if="project.pinned" class="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-indigo-500 to-purple-500" />

    <!-- Action buttons -->
    <div class="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        @click="handleTogglePin"
        :title="project.pinned ? 'Unpin' : 'Pin'"
        class="p-1 rounded transition-colors"
        :class="project.pinned ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 hover:text-indigo-400'"
      >
        <component :is="project.pinned ? PinOff : Pin" class="h-3.5 w-3.5" />
      </button>
      <button
        @click="emit('open-notes', project)"
        title="Notes"
        class="p-1 rounded text-gray-500 hover:text-yellow-400 transition-colors"
      >
        <StickyNote class="h-3.5 w-3.5" />
      </button>
      <button
        @click="emit('open-edit', project)"
        title="Edit Project"
        class="p-1 rounded text-gray-500 hover:text-blue-400 transition-colors"
      >
        <Pencil class="h-3.5 w-3.5" />
      </button>
      <button
        @click="handleDelete"
        title="Remove Project"
        class="p-1 rounded text-gray-500 hover:text-red-500 transition-colors"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>
    </div>

    <CardHeader>
      <div class="flex items-center gap-2 pr-20" :class="selectable ? 'ml-8' : ''">
        <span v-if="project.health !== false" class="inline-flex h-1.5 w-1.5 rounded-full flex-shrink-0" :class="project.status === 'running' ? 'bg-emerald-500' : 'bg-gray-600'" />
        <TriangleAlert v-else class="h-3.5 w-3.5 text-red-500 flex-shrink-0 animate-pulse" title="Path not found!" />
        <CardTitle class="truncate" :class="project.health === false ? 'text-red-400' : ''">{{ project.name }}</CardTitle>
      </div>
      <CardDescription class="mt-1.5 line-clamp-2" :title="project.description">
        {{ project.description || 'No description provided.' }}
      </CardDescription>
    </CardHeader>

    <CardContent class="flex-1">
      <div class="space-y-4">
        <div>
          <div class="flex items-center gap-1.5 group/path">
            <p class="text-[10px] text-gray-500 font-mono truncate" :title="project.path">
              {{ project.path }}
            </p>
            <button @click="handleCopyPath" class="opacity-0 group-hover/path:opacity-100 p-0.5 rounded hover:bg-gray-800 text-gray-400" title="Copy Path">
              <FileCode class="h-2.5 w-2.5" />
            </button>
          </div>
          <p v-if="project.startCommand" class="text-[10px] text-indigo-400 font-mono truncate mt-0.5" :title="project.startCommand">
            $ {{ project.startCommand }}
          </p>

          <!-- Git Status -->
          <div v-if="git" class="flex items-center gap-2 mt-2 px-2 py-1 bg-gray-900/40 border border-gray-800 rounded-lg w-fit">
            <GitBranch class="h-3 w-3 text-emerald-400" />
            <span class="text-[10px] font-medium text-gray-300">{{ git.branch }}</span>
            <div v-if="git.hasUncommitted" class="flex items-center gap-1 ml-0.5" title="Uncommitted changes">
              <span class="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <span v-if="git.lastCommit" class="text-[9px] text-gray-500 ml-1 ml-auto">{{ git.lastCommit }}</span>
          </div>
        </div>

        <!-- Labels -->
        <div class="flex flex-wrap gap-1" v-if="projectLabels.length > 0">
          <span
            v-for="label in projectLabels"
            :key="label.id"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
            :style="{ backgroundColor: label.color + '20', color: label.color, border: '1px solid ' + label.color + '40' }"
          >
            <Tag class="h-2 w-2" />
            {{ label.name }}
          </span>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1" v-if="project.tags && project.tags.length > 0">
          <Badge
            v-for="tag in project.tags"
            :key="tag"
            variant="secondary"
            class="text-[10px] px-1.5 py-0.5 border-gray-800 flex items-center gap-1"
          >
            <FileCode v-if="Object.keys(TECH_ICONS).some(k => tag.toLowerCase().includes(k))" class="h-2.5 w-2.5 text-indigo-400" />
            {{ tag }}
          </Badge>
        </div>
      </div>
    </CardContent>

    <CardFooter class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-800">
      <Button size="sm" @click="handleStart" class="flex-1">
        <Play class="mr-1.5 h-3.5 w-3.5" /> Start
      </Button>
      <Button size="icon" variant="outline" @click="handleOpenVSCode" title="Open in VS Code" class="h-8 w-8">
        <Code class="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="outline" @click="handleOpenFolder" title="Open Folder" class="h-8 w-8">
        <FolderOpen class="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="outline" @click="emit('open-notes', project)" title="Notes" class="h-8 w-8">
        <StickyNote class="h-3.5 w-3.5" />
      </Button>
    </CardFooter>
  </Card>
</template>
