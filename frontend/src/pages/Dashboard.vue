<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Plus, Search, Layers, Settings, FolderPlus,
  Pin, Tag, ChevronDown, ChevronRight, Boxes, Clock,
  StickyNote, FileText, Network, Zap, TrendingUp, RefreshCw, Trash2, ShieldCheck, CheckSquare
} from 'lucide-vue-next'
import ProjectCard from '../components/ProjectCard.vue'
import Sidebar from '../components/Sidebar.vue'
import AddProjectDialog from '../components/AddProjectDialog.vue'
import BulkAddDialog from '../components/BulkAddDialog.vue'
import BulkDeleteDialog from '../components/BulkDeleteDialog.vue'
import EditProjectDialog from '../components/EditProjectDialog.vue'
import SettingsDialog from '../components/SettingsDialog.vue'
import NotesPanel from '../components/NotesPanel.vue'
import PortManager from '../components/PortManager.vue'
import LabelManager from '../components/LabelManager.vue'
import { fetchProjects, fetchLabels, fetchStats, fetchGitStatuses, deleteProject } from '../services/api'
import type { Project, Label, DashboardStats, GitInfo } from '../services/api'

const projects = ref<Project[]>([])
const labels = ref<Label[]>([])
const stats = ref<DashboardStats | null>(null)
const gitStatuses = ref<Record<string, GitInfo>>({})
const search = ref('')
const urlParams = new URLSearchParams(window.location.search)
const initialLabels = urlParams.get('labels')
const labelFilter = ref<string[]>(initialLabels ? initialLabels.split(',') : [])
const isAddDialogOpen = ref(false)
const isBulkAddDialogOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)

// Bulk Selection
const selectionMode = ref(false)
const selectedProjectIds = ref<Set<string>>(new Set())

const toggleSelection = (id: string) => {
  if (selectedProjectIds.value.has(id)) {
    selectedProjectIds.value.delete(id)
  } else {
    selectedProjectIds.value.add(id)
  }
}

const clearSelection = () => {
  selectedProjectIds.value.clear()
  selectionMode.value = false
}

const handleBulkDeleteSelected = async () => {
  if (selectedProjectIds.value.size === 0) return
  if (!confirm(`Permanently delete ${selectedProjectIds.value.size} projects?`)) return
  
  try {
    await Promise.all(Array.from(selectedProjectIds.value).map(id => deleteProject(id)))
    refreshAll()
    clearSelection()
  } catch (e) {
    console.error('Bulk delete failed', e)
    alert('Some projects could not be deleted.')
  }
}

watch(labelFilter, (newLabels) => {
  const url = new URL(window.location.href)
  if (newLabels.length > 0) {
    url.searchParams.set('labels', newLabels.join(','))
  } else {
    url.searchParams.delete('labels')
  }
  window.history.replaceState({}, '', url.toString())
}, { deep: true })
const isSettingsDialogOpen = ref(false)
const isLabelManagerOpen = ref(false)

// Notes panel
const notesPanelProject = ref<Project | null>(null)
const isNotesPanelOpen = computed(() => !!notesPanelProject.value)

// Edit dialog
const editingProject = ref<Project | null>(null)
const isEditDialogOpen = ref(false)

// Group collapse state
const collapsedGroups = ref<Record<string, boolean>>({})

// Stats refresh interval
let statsInterval: ReturnType<typeof setInterval> | null = null

const loadProjects = async () => {
  try {
    projects.value = await fetchProjects()
  } catch (error) {
    console.error('Failed to load projects', error)
  }
}

const loadGitStatuses = async () => {
  try {
    gitStatuses.value = await fetchGitStatuses()
  } catch (error) {
    console.error('Failed to load git statuses', error)
  }
}

const loadLabels = async () => {
  try {
    labels.value = await fetchLabels()
  } catch (error) {
    console.error('Failed to load labels', error)
  }
}

const loadStats = async () => {
  try {
    stats.value = await fetchStats()
  } catch (error) {
    console.error('Failed to load stats', error)
  }
}

const refreshAll = async () => {
  await Promise.all([
    loadProjects(),
    loadGitStatuses(),
    loadLabels(),
    loadStats()
  ])
}

onMounted(() => {
  document.documentElement.classList.add('dark')
  loadProjects()
  loadGitStatuses()
  loadLabels()
  loadStats()

  // Refresh stats every 30s
  statsInterval = setInterval(loadStats, 30000)

  // Ctrl+K focus search
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  if (statsInterval) clearInterval(statsInterval)
  window.removeEventListener('keydown', handleGlobalKey)
})

const searchInput = ref<HTMLInputElement | null>(null)
const handleGlobalKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

// ── KPIs ────────────────────────────────────────────────────

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []

  const recentlyOpened = projects.value.filter(p => p.lastOpened).length
  const noStartCmd = s.total - s.withStartCmd

  return [
    {
      label: 'Total Projects', value: s.total,
      icon: Boxes, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20',
      sub: `${s.groups} group${s.groups !== 1 ? 's' : ''}`
    },
    {
      label: 'Pinned', value: s.pinned,
      icon: Pin, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
      sub: `${s.labeled} labeled`
    },
    {
      label: 'Notes', value: s.totalNotes,
      icon: StickyNote, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20',
      sub: recentlyOpened > 0 ? `${recentlyOpened} opened` : 'across all projects'
    },
    {
      label: 'Active Ports', value: s.activePorts,
      icon: Network, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20',
      sub: `${s.withStartCmd} with start cmd`
    },
    {
      label: 'Ready to Start', value: s.withStartCmd,
      icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: noStartCmd > 0 ? `${noStartCmd} need config` : 'all configured!'
    },
    {
      label: 'Labeled', value: s.labeled,
      icon: Tag, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
      sub: `of ${s.total} projects`
    },
  ]
})

// ── Filtered projects ────────────────────────────────────────

const filteredProjects = computed(() => {
  let result = projects.value
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.description && p.description.toLowerCase().includes(s)) ||
      (p.path && p.path.toLowerCase().includes(s)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(s)))
    )
  }
  if (labelFilter.value.length > 0) {
    result = result.filter(p =>
      p.labels && labelFilter.value.every(lid => p.labels.includes(lid))
    )
  }
  return result
})

// ── Top Technologies ──────────────────────────────────────────

const topTechnologies = computed(() => {
  const tagCounts: Record<string, number> = {}
  projects.value.forEach(p => {
    if (p.tags) {
      p.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1
      })
    }
  })
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
})

// ── Pinned / Grouped / Ungrouped ────────────────────────────

const pinnedProjects = computed(() => filteredProjects.value.filter(p => p.pinned))
const unpinnedProjects = computed(() => filteredProjects.value.filter(p => !p.pinned))

const groupedProjects = computed(() => {
  const groups: Record<string, Project[]> = {}
  const ungrouped: Project[] = []
  unpinnedProjects.value.forEach(p => {
    if (p.groupName) {
      if (!groups[p.groupName]) groups[p.groupName] = []
      groups[p.groupName].push(p)
    } else {
      ungrouped.push(p)
    }
  })
  return { groups, ungrouped }
})

const recentProjects = computed(() =>
  [...projects.value]
    .filter(p => p.lastOpened)
    .sort((a, b) => new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime())
    .slice(0, 5)
)

const toggleGroup = (name: string) => {
  collapsedGroups.value[name] = !collapsedGroups.value[name]
}

const toggleLabelFilter = (id: string) => {
  if (labelFilter.value.includes(id)) {
    labelFilter.value = labelFilter.value.filter(l => l !== id)
  } else {
    labelFilter.value.push(id)
  }
}

// ── Project events ───────────────────────────────────────────

const handleProjectUpdated = (updated: Project) => {
  const idx = projects.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) projects.value[idx] = updated
  loadStats()
}

const handleProjectDeleted = () => {
  loadProjects()
  loadStats()
}

const openNotes = (project: Project) => { notesPanelProject.value = project }
const closeNotes = () => { notesPanelProject.value = null }

const openEdit = (project: Project) => {
  editingProject.value = project
  isEditDialogOpen.value = true
}

const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex font-sans text-gray-100">
    <!-- Sidebar -->
    <Sidebar 
      :projects="projects"
      :recent-projects="recentProjects"
      :labels="labels"
      :label-filter="labelFilter"
      @add-project="isAddDialogOpen = true"
      @bulk-add="isBulkAddDialogOpen = true"
      @manage-labels="isLabelManagerOpen = true"
      @toggle-label="toggleLabelFilter"
      @open-settings="isSettingsDialogOpen = true"
      @open-edit="openEdit"
    />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Topbar -->
      <header class="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between sticky top-0 z-10">
        <div class="flex items-center flex-1 max-w-sm relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            ref="searchInput"
            v-model="search"
            placeholder="Search projects… (Ctrl+K)"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="refreshAll"
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw class="h-4 w-4" />
          </button>
          <!-- Active label filters pills -->
          <div class="flex gap-1" v-if="labelFilter.length > 0">
            <button
              v-for="lid in labelFilter"
              :key="lid"
              @click="toggleLabelFilter(lid)"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              :style="{ backgroundColor: labels.find(l=>l.id===lid)?.color + '25', color: labels.find(l=>l.id===lid)?.color, border: '1px solid ' + (labels.find(l=>l.id===lid)?.color || '') + '40' }"
            >
              {{ labels.find(l => l.id === lid)?.name }} ✕
            </button>
          </div>
          <button
            @click="selectionMode = !selectionMode; if(!selectionMode) clearSelection()"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="selectionMode ? 'bg-emerald-600 text-white' : 'border border-gray-700 text-gray-400 hover:bg-gray-800'"
          >
            <CheckSquare class="h-4 w-4" /> {{ selectionMode ? 'Exit Selection' : 'Select Projects' }}
          </button>
          <button
            @click="isBulkAddDialogOpen = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <FolderPlus class="h-4 w-4" /> Bulk Add
          </button>
          <button
            @click="isBulkDeleteDialogOpen = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
          >
            <Trash2 class="h-4 w-4" /> Bulk Delete
          </button>
          <button
            @click="isAddDialogOpen = true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Plus class="h-4 w-4" /> Add Project
          </button>
        </div>
      </header>
      
      <!-- Bulk Selection Toolbar -->
      <div v-if="selectionMode" class="bg-emerald-900/30 border-b border-emerald-800/50 px-6 py-2 flex items-center justify-between sticky top-14 z-10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
        <div class="flex items-center gap-4">
          <span class="text-sm font-bold text-emerald-400 tracking-tight">{{ selectedProjectIds.size }} projects selected</span>
          <button @click="clearSelection" class="text-xs text-emerald-500/70 hover:text-emerald-400 underline decoration-emerald-800">Deselect all</button>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="handleBulkDeleteSelected"
            :disabled="selectedProjectIds.size === 0"
            class="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50"
          >
            <Trash2 class="h-3.5 w-3.5" /> Delete Selected
          </button>
          <button @click="selectionMode = false; clearSelection()" class="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200">Cancel</button>
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5">

        <!-- Page title -->
        <div class="flex items-end justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white tracking-tight">Projects</h1>
            <p class="text-gray-500 text-sm mt-0.5">Manage and launch your local development environments.</p>
          </div>
          <div class="text-xs text-gray-600" v-if="filteredProjects.length !== projects.length">
            Showing {{ filteredProjects.length }} of {{ projects.length }}
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div
            v-for="kpi in kpis"
            :key="kpi.label"
            class="flex flex-col gap-2 rounded-xl border px-4 py-3 transition-all hover:scale-[1.02] cursor-default"
            :class="kpi.bg"
          >
            <div class="flex items-center justify-between">
              <component :is="kpi.icon" class="h-4 w-4" :class="kpi.color" />
              <span class="text-2xl font-bold text-white">{{ kpi.value }}</span>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-300">{{ kpi.label }}</p>
              <p class="text-[10px] text-gray-500 mt-0.5">{{ kpi.sub }}</p>
            </div>
          </div>
        </div>

        <!-- Top Technologies -->
        <div v-if="topTechnologies.length > 0" class="flex flex-wrap items-center gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-800">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp class="h-3.5 w-3.5 text-indigo-400" /> Most Used Technologies:</span>
          <div class="flex flex-wrap gap-2">
            <span v-for="tech in topTechnologies" :key="tech.name" class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              {{ tech.name }} <span class="bg-indigo-500/20 text-indigo-200 px-1 rounded-sm text-[10px]">{{ tech.count }}</span>
            </span>
          </div>
        </div>

        <!-- Port Manager -->
        <PortManager :projects="projects" />

        <!-- Empty state -->
        <div
          v-if="filteredProjects.length === 0"
          class="flex flex-col items-center justify-center p-16 text-center rounded-xl border border-dashed border-gray-700 bg-gray-900/40"
        >
          <Layers class="h-12 w-12 text-gray-600 mb-4" />
          <h2 class="text-lg font-semibold text-gray-300 mb-1">No projects found</h2>
          <p class="text-gray-500 text-sm max-w-xs mb-5">
            {{ search || labelFilter.length > 0 ? 'Try changing your search or filter.' : "You haven't added any projects yet." }}
          </p>
          <div class="flex gap-3">
            <button @click="isAddDialogOpen = true" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              Add your first project
            </button>
            <button @click="isBulkAddDialogOpen = true" class="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
              Bulk add projects
            </button>
          </div>
        </div>

        <!-- Pinned Projects -->
        <div v-if="pinnedProjects.length > 0" class="space-y-3">
          <div class="flex items-center gap-2">
            <Pin class="h-3.5 w-3.5 text-amber-400" />
            <h2 class="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pinned</h2>
            <span class="text-[10px] text-gray-600">{{ pinnedProjects.length }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ProjectCard
              v-for="project in pinnedProjects"
              :key="project.id"
              :project="project"
              :labels="labels"
              :git="gitStatuses[project.id]"
              :selectable="selectionMode"
              :selected="selectedProjectIds.has(project.id)"
              @select="toggleSelection"
              @deleted="handleProjectDeleted"
              @updated="handleProjectUpdated"
              @open-notes="openNotes"
              @open-edit="openEdit"
            />
          </div>
        </div>

        <!-- Grouped Projects -->
        <div v-for="(groupProjects, groupName) in groupedProjects.groups" :key="groupName" class="space-y-3">
          <button @click="toggleGroup(String(groupName))" class="flex items-center gap-2 group">
            <component
              :is="collapsedGroups[String(groupName)] ? ChevronRight : ChevronDown"
              class="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors"
            />
            <Layers class="h-3.5 w-3.5 text-cyan-400" />
            <span class="text-xs font-semibold text-cyan-400 uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
              {{ groupName }}
            </span>
            <span class="text-[10px] bg-cyan-900/30 text-cyan-500 border border-cyan-800/40 rounded px-1.5 py-0.5">
              {{ groupProjects.length }}
            </span>
          </button>

          <Transition name="accordion">
            <div v-if="!collapsedGroups[String(groupName)]" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-5 border-l-2 border-cyan-900/40">
              <ProjectCard
                v-for="project in groupProjects"
                :key="project.id"
                :project="project"
                :labels="labels"
                :git="gitStatuses[project.id]"
                :selectable="selectionMode"
                :selected="selectedProjectIds.has(project.id)"
                @select="toggleSelection"
                @deleted="handleProjectDeleted"
                @updated="handleProjectUpdated"
                @open-notes="openNotes"
                @open-edit="openEdit"
              />
            </div>
          </Transition>
        </div>

        <!-- Ungrouped Projects -->
        <div v-if="groupedProjects.ungrouped.length > 0" class="space-y-3">
          <div v-if="Object.keys(groupedProjects.groups).length > 0 || pinnedProjects.length > 0" class="flex items-center gap-2">
            <Boxes class="h-3.5 w-3.5 text-gray-500" />
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Projects</h2>
            <span class="text-[10px] text-gray-600">{{ groupedProjects.ungrouped.length }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ProjectCard
              v-for="project in groupedProjects.ungrouped"
              :key="project.id"
              :project="project"
              :labels="labels"
              :git="gitStatuses[project.id]"
              :selectable="selectionMode"
              :selected="selectedProjectIds.has(project.id)"
              @select="toggleSelection"
              @deleted="handleProjectDeleted"
              @updated="handleProjectUpdated"
              @open-notes="openNotes"
              @open-edit="openEdit"
            />
          </div>
        </div>

      </div>
    </main>

    <!-- Notes slide panel -->
    <NotesPanel
      v-if="notesPanelProject"
      :project-id="notesPanelProject.id"
      :project-name="notesPanelProject.name"
      :labels="labels"
      :open="isNotesPanelOpen"
      @close="closeNotes"
    />

    <!-- Dialogs -->
    <AddProjectDialog v-model:open="isAddDialogOpen" :labels="labels" @added="loadProjects(); loadStats()" />
    <BulkAddDialog v-model:open="isBulkAddDialogOpen" @added="loadProjects(); loadStats()" />
    <BulkDeleteDialog v-model:open="isBulkDeleteDialogOpen" :projects="projects" @deleted="loadProjects(); loadStats()" />
    <EditProjectDialog
      v-model:open="isEditDialogOpen"
      :project="editingProject"
      :labels="labels"
      @updated="handleProjectUpdated"
    />
    <SettingsDialog v-model:open="isSettingsDialogOpen" />
    <LabelManager v-model:open="isLabelManagerOpen" :labels="labels" @changed="loadLabels" />
  </div>
</template>

<style scoped>
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to { opacity: 0; transform: translateY(-4px); }
.accordion-enter-to, .accordion-leave-from { opacity: 1; transform: translateY(0); }
</style>
