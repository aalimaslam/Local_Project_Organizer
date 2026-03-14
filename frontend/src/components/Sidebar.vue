<script setup lang="ts">
import { 
  Layers, Boxes, Plus, FolderPlus, Clock, Settings, ShieldCheck 
} from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import type { Project, Label } from '../services/api'

defineProps<{
  recentProjects: Project[]
  labels: Label[]
  labelFilter: string[]
}>()

const emit = defineEmits<{
  (e: 'add-project'): void
  (e: 'bulk-add'): void
  (e: 'manage-labels'): void
  (e: 'toggle-label', id: string): void
  (e: 'open-settings'): void
  (e: 'open-edit', project: Project): void
}>()

const router = useRouter()
const route = useRoute()

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
  <aside class="w-56 border-r border-gray-800 bg-gray-900 flex flex-col h-screen sticky top-0 flex-shrink-0">
    <!-- Logo -->
    <div class="h-14 flex items-center px-4 border-b border-gray-800 cursor-pointer" @click="router.push('/')">
      <div class="flex items-center gap-2">
        <div class="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
          <Layers class="h-4 w-4 text-white" />
        </div>
        <span class="font-bold text-white tracking-tight text-lg">LocalOrg</span>
      </div>
    </div>

    <div class="flex flex-col flex-1 overflow-y-auto p-3 gap-0.5">
      <!-- Nav items -->
      <button 
        @click="router.push('/')"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
        :class="route.path === '/' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
      >
        <Boxes class="h-4 w-4" /> All Projects
      </button>
      <button
        @click="emit('add-project')"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium text-sm transition-colors"
      >
        <Plus class="h-4 w-4" /> Add Project
      </button>
      <button
        @click="emit('bulk-add')"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium text-sm transition-colors"
      >
        <FolderPlus class="h-4 w-4" /> Bulk Add
      </button>

      <!-- Recent -->
      <div class="mt-4" v-if="recentProjects.length > 0">
        <div class="flex items-center px-3 mb-1">
          <Clock class="h-3 w-3 text-gray-500 mr-1.5" />
          <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Recently Opened</span>
        </div>
        <div class="space-y-0.5">
          <button
            v-for="p in recentProjects"
            :key="p.id"
            @click="emit('open-edit', p)"
            class="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <span class="truncate">{{ p.name }}</span>
            <span class="text-[10px] text-gray-600 flex-shrink-0">{{ formatRelative(p.lastOpened) }}</span>
          </button>
        </div>
      </div>

      <!-- Labels section -->
      <div class="mt-4" v-if="labels.length > 0">
        <div class="flex items-center justify-between px-3 mb-1.5">
          <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Labels</span>
          <button
            @click="emit('manage-labels')"
            class="text-gray-500 hover:text-gray-300 transition-colors"
            title="Manage Labels"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>
        <div class="space-y-0.5">
          <button
            v-for="label in labels"
            :key="label.id"
            @click="emit('toggle-label', label.id)"
            class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="labelFilter.includes(label.id) ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'"
            :style="{ color: label.color }"
          >
            <span class="h-2 w-2 rounded-full flex-shrink-0" :style="{ backgroundColor: label.color }" />
            {{ label.name }}
            <span v-if="labelFilter.includes(label.id)" class="ml-auto text-[9px] text-gray-500">✕</span>
          </button>
        </div>
      </div>

      <!-- Bottom settings -->
      <div class="mt-auto space-y-0.5 pt-4 border-t border-gray-800">
        <button
          @click="router.push('/vault')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
          :class="route.path === '/vault' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 'text-gray-400 hover:bg-orange-900/20 hover:text-orange-300'"
        >
          <ShieldCheck class="h-4 w-4" /> Secret Vault
        </button>
        <button
          @click="emit('open-settings')"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium text-sm transition-colors"
        >
          <Settings class="h-4 w-4" /> AI Settings
        </button>
      </div>
    </div>
  </aside>
</template>
