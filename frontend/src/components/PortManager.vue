<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronDown, ChevronRight, Plus, Trash2, Network, LinkIcon, RefreshCw, Radio } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import type { PortEntry, ActivePort, Project } from '../services/api'
import { fetchPorts, fetchActivePorts, addPort, deletePort } from '../services/api'

const props = defineProps<{
  projects: Project[]
}>()

const collapsed = ref(false)
const ports = ref<PortEntry[]>([])
const activePorts = ref<ActivePort[]>([])
const newPort = ref('')
const newDesc = ref('')
const newProjectId = ref('')
const loading = ref(false)
const scanningActive = ref(false)
const activeTab = ref<'registered' | 'active'>('registered')

const loadPorts = async () => {
  ports.value = await fetchPorts()
}

const scanActive = async () => {
  scanningActive.value = true
  try {
    activePorts.value = await fetchActivePorts()
  } catch (e) {
    console.error('Failed to scan ports', e)
  } finally {
    scanningActive.value = false
  }
}

onMounted(async () => {
  await loadPorts()
  // Scan active ports initially
  await scanActive()
})

const handleAdd = async () => {
  const portNum = parseInt(newPort.value)
  if (!portNum || portNum < 1 || portNum > 65535) return
  loading.value = true
  try {
    const proj = props.projects.find(p => p.id === newProjectId.value)
    const entry = await addPort({
      port: portNum,
      projectId: newProjectId.value || null,
      projectName: proj?.name || '',
      description: newDesc.value.trim()
    })
    ports.value.push(entry)
    newPort.value = ''
    newDesc.value = ''
    newProjectId.value = ''
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string) => {
  await deletePort(id)
  ports.value = ports.value.filter(p => p.id !== id)
}

// Quick-register from active port
const quickRegister = async (activePort: ActivePort) => {
  const entry = await addPort({
    port: activePort.port,
    projectId: null,
    projectName: '',
    description: activePort.processName || `PID ${activePort.pid}`
  })
  ports.value.push(entry)
}

const openLocalhost = (port: number) => {
  window.open(`http://localhost:${port}`, '_blank')
}

// Well-known port names
const PORT_NAMES: Record<number, string> = {
  80: 'HTTP', 443: 'HTTPS', 3000: 'React/Node Dev', 3001: 'Node Alt',
  4000: 'Phoenix/Dev', 4200: 'Angular Dev', 5000: 'Flask/Dev',
  5173: 'Vite Dev', 5174: 'Vite Alt', 5432: 'PostgreSQL',
  6001: 'Local Dash API', 6379: 'Redis', 7000: 'Dev Server',
  8000: 'Django/FastAPI', 8080: 'HTTP Alt', 8443: 'HTTPS Alt',
  8888: 'Jupyter', 9000: 'Dev', 27017: 'MongoDB',
}
const getPortName = (port: number) => PORT_NAMES[port] || ''
</script>

<template>
  <div class="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50">
    <!-- Header (toggle) -->
    <button
      @click="collapsed = !collapsed"
      class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/60 transition-colors group"
    >
      <div class="flex items-center gap-2">
        <Network class="h-4 w-4 text-cyan-400" />
        <span class="font-semibold text-sm text-gray-200">Port Manager</span>
        <span class="text-[10px] bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 rounded px-1.5 py-0.5">
          {{ ports.length }} tracked · {{ activePorts.length }} active
        </span>
      </div>
      <component :is="collapsed ? ChevronRight : ChevronDown" class="h-4 w-4 text-gray-400 group-hover:text-gray-200 transition-colors" />
    </button>

    <Transition name="accordion">
      <div v-if="!collapsed" class="border-t border-gray-700">
        <!-- Tabs -->
        <div class="flex border-b border-gray-800">
          <button
            @click="activeTab = 'registered'"
            class="flex-1 px-4 py-2 text-xs font-medium transition-colors"
            :class="activeTab === 'registered' ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-900/10' : 'text-gray-500 hover:text-gray-300'"
          >
            Tracked Ports ({{ ports.length }})
          </button>
          <button
            @click="activeTab = 'active'; scanActive()"
            class="flex-1 px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            :class="activeTab === 'active' ? 'text-green-400 border-b-2 border-green-500 bg-green-900/10' : 'text-gray-500 hover:text-gray-300'"
          >
            <Radio class="h-3 w-3" :class="{'animate-pulse': scanningActive}" />
            Live Scan ({{ activePorts.length }})
          </button>
        </div>

        <!-- Registered ports list -->
        <div v-if="activeTab === 'registered'" class="max-h-52 overflow-y-auto divide-y divide-gray-800/80">
          <div v-if="ports.length === 0" class="px-4 py-5 text-center text-sm text-gray-500">
            No ports tracked yet — add one below or pick from Live Scan
          </div>
          <div
            v-for="entry in ports"
            :key="entry.id"
            class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/40 group transition-colors"
          >
            <div class="flex items-center gap-3">
              <button
                @click="openLocalhost(entry.port)"
                class="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-900/30 border border-cyan-700/50 rounded text-cyan-400 hover:bg-cyan-800/40 transition-colors text-xs font-mono font-bold"
              >
                <LinkIcon class="h-3 w-3" />
                :{{ entry.port }}
              </button>
              <div>
                <p class="text-sm text-gray-200 leading-none">{{ entry.description || activePorts.find(a => a.port === entry.port)?.processName || getPortName(entry.port) || '—' }}</p>
                <p class="text-[10px] text-gray-500 mt-0.5" v-if="entry.projectName">{{ entry.projectName }}</p>
              </div>
            </div>
            <button
              @click="handleDelete(entry.id)"
              class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Active (live) ports -->
        <div v-if="activeTab === 'active'" class="max-h-52 overflow-y-auto divide-y divide-gray-800/80">
          <div class="flex items-center justify-between px-4 py-2 bg-gray-800/30">
            <span class="text-[10px] text-gray-500">System ports in LISTEN state</span>
            <button @click="scanActive" class="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 transition-colors">
              <RefreshCw class="h-3 w-3" :class="{'animate-spin': scanningActive}" /> Refresh
            </button>
          </div>
          <div v-if="activePorts.length === 0" class="px-4 py-5 text-center text-sm text-gray-500">
            {{ scanningActive ? 'Scanning...' : 'No active listening ports found' }}
          </div>
          <div
            v-for="ap in activePorts"
            :key="ap.port"
            class="flex items-center justify-between px-4 py-2 hover:bg-gray-800/40 group transition-colors"
          >
            <div class="flex items-center gap-3">
              <button
                @click="openLocalhost(ap.port)"
                class="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/30 border border-green-700/50 rounded text-green-400 hover:bg-green-800/40 transition-colors text-xs font-mono font-bold"
              >
                <Radio class="h-3 w-3" />
                :{{ ap.port }}
              </button>
              <div>
                <p class="text-sm text-gray-200 leading-none">{{ ap.processName || getPortName(ap.port) || `PID ${ap.pid}` }}</p>
                <div class="flex gap-2 items-center mt-0.5">
                  <p class="text-[10px] text-gray-500" v-if="ap.processName && getPortName(ap.port)">{{ getPortName(ap.port) }}</p>
                  <p class="text-[10px] text-gray-500">PID: {{ ap.pid }}</p>
                </div>
              </div>
            </div>
            <button
              @click="quickRegister(ap)"
              title="Track this port"
              class="text-[10px] text-gray-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
            >
              <Plus class="h-3 w-3" /> Track
            </button>
          </div>
        </div>

        <!-- Add port form -->
        <div v-if="activeTab === 'registered'" class="px-4 py-3 border-t border-gray-800 flex flex-wrap gap-2 bg-gray-900/30">
          <input
            v-model="newPort"
            type="number"
            min="1"
            max="65535"
            placeholder="Port (e.g. 3000)"
            class="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            @keydown.enter="handleAdd"
          />
          <input
            v-model="newDesc"
            type="text"
            placeholder="Description (optional)"
            class="flex-1 min-w-[100px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            @keydown.enter="handleAdd"
          />
          <select
            v-model="newProjectId"
            class="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">No project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <Button size="sm" @click="handleAdd" :disabled="loading || !newPort" class="bg-cyan-700 hover:bg-cyan-600 text-white border-0 px-2">
            <Plus class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to { max-height: 0; opacity: 0; }
.accordion-enter-to, .accordion-leave-from { max-height: 600px; opacity: 1; }
</style>
