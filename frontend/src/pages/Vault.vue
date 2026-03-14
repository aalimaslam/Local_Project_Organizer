<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Plus, Trash2, Eye, EyeOff, Search, ShieldCheck, 
  Lock, ArrowLeft, Database, Key, ShieldAlert, Copy, CheckCircle2
} from 'lucide-vue-next'
import Sidebar from '../components/Sidebar.vue'
import Button from '../components/ui/Button.vue'
import Input from '../components/ui/Input.vue'
import { 
  fetchSecrets, addSecret, deleteSecret, fetchProjects, fetchLabels, 
  fetchVaultStatus, initVault, verifyVault,
  type Secret, type Project, type Label 
} from '../services/api'

const projects = ref<Project[]>([])
const labels = ref<Label[]>([])
const secrets = ref<Secret[]>([])
const loading = ref(false)
const search = ref('')
const showValues = ref<Record<string, boolean>>({})
const copiedId = ref<string | null>(null)

// Auth state
const isInitialized = ref(true)
const isAuthenticated = ref(false)
const vaultPassword = ref('')
const authError = ref(false)
const loadingStatus = ref(true)

// Init state
const initPassword = ref('')
const confirmPassword = ref('')
const initError = ref('')

// Form state
const newKey = ref('')
const newValue = ref('')
const newCategory = ref('password')
const newProjectId = ref<string>('')
const newDesc = ref('')
const isAdding = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const [p, l, s] = await Promise.all([
      fetchProjects(),
      fetchLabels(),
      fetchSecrets()
    ])
    projects.value = p
    labels.value = l
    secrets.value = s
  } finally {
    loading.value = false
  }
}

const checkStatus = async () => {
  loadingStatus.value = true
  try {
    const { initialized } = await fetchVaultStatus()
    isInitialized.value = initialized
  } finally {
    loadingStatus.value = false
  }
}

onMounted(() => {
  checkStatus()
})

const handleAuth = async () => {
  if (!vaultPassword.value) return
  authError.value = false
  try {
    const { success } = await verifyVault(vaultPassword.value)
    if (success) {
      isAuthenticated.value = true
      loadData()
    }
  } catch (e: any) {
    authError.value = true
    vaultPassword.value = ''
    console.error('Auth failed', e)
  }
}

const handleInit = async () => {
  if (!initPassword.value) return
  if (initPassword.value !== confirmPassword.value) {
    initError.value = 'Passwords do not match'
    return
  }
  
  try {
    await initVault(initPassword.value)
    isInitialized.value = true
    vaultPassword.value = initPassword.value
    handleAuth()
  } catch (e: any) {
    initError.value = e.response?.data?.error || 'Initialization failed'
  }
}

const filteredSecrets = computed(() => {
  const s = search.value.toLowerCase()
  return secrets.value.filter(sec => 
    sec.key.toLowerCase().includes(s) || 
    sec.description?.toLowerCase().includes(s) ||
    sec.category.toLowerCase().includes(s)
  )
})

const handleAdd = async () => {
  if (!newKey.value || !newValue.value) return
  isAdding.value = true
  try {
    const s = await addSecret({
      key: newKey.value,
      value: newValue.value,
      category: newCategory.value,
      projectId: newProjectId.value || null,
      description: newDesc.value
    })
    secrets.value.unshift(s)
    newKey.value = ''
    newValue.value = ''
    newDesc.value = ''
  } finally {
    isAdding.value = false
  }
}

const handleDelete = async (id: string, key: string) => {
  if (!confirm(`Permanently delete secret "${key}"?`)) return
  await deleteSecret(id)
  secrets.value = secrets.value.filter(s => s.id !== id)
}

const toggleValue = (id: string) => {
  showValues.value[id] = !showValues.value[id]
}

const copyToClipboard = (val: string, id: string) => {
  navigator.clipboard.writeText(val)
  copiedId.value = id
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 2000)
}

const getProjectName = (id: string | null) => {
  if (!id) return 'Global'
  return projects.value.find(p => p.id === id)?.name || 'Unknown'
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex font-sans text-gray-100">
    <!-- Reuse Sidebar Logic partially or wrap properly -->
    <Sidebar 
      :recent-projects="[]"
      :labels="labels"
      :label-filter="[]"
    />

    <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Topbar -->
      <header class="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6 justify-between sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <ShieldCheck class="h-5 w-5 text-orange-400" />
          </div>
          <h1 class="text-lg font-bold text-white italic tracking-tighter">Vault Manager</h1>
        </div>

        <div v-if="isAuthenticated" class="flex items-center gap-4">
          <div class="relative w-64">
             <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
             <input 
              v-model="search" 
              placeholder="Filter secrets..." 
              class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" 
             />
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto">
        <!-- Initialization Screen -->
        <div v-if="!loadingStatus && !isInitialized" class="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <div class="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-orange-950/20">
            <div class="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <Key class="h-8 w-8 text-orange-400" />
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Setup Your Vault</h2>
            <p class="text-gray-400 text-sm mb-8">This is your first time. Set a master password to protect your secrets.</p>
            
            <div class="space-y-4">
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] text-gray-500 font-bold ml-1 uppercase">Master Password</label>
                <Input v-model="initPassword" type="password" placeholder="Choose a strong password" class="bg-gray-800 border-gray-700" />
              </div>
              <div class="space-y-1.5 text-left">
                <label class="text-[10px] text-gray-500 font-bold ml-1 uppercase">Confirm Password</label>
                <Input v-model="confirmPassword" type="password" placeholder="Repeat your password" class="bg-gray-800 border-gray-700" />
              </div>
              <p v-if="initError" class="text-red-400 text-xs text-center">{{ initError }}</p>
              <Button @click="handleInit" class="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12">
                Initialize Vault
              </Button>
            </div>
          </div>
        </div>

        <!-- Login Screen -->
        <div v-else-if="!loadingStatus && !isAuthenticated" class="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
          <div class="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-orange-950/20">
            <div class="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock class="h-8 w-8 text-orange-400 animate-pulse" />
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Vault Locked</h2>
            <p class="text-gray-400 text-sm mb-8">Enter your master password to access sensitive developer secrets.</p>
            
            <div class="space-y-4">
              <Input 
                v-model="vaultPassword" 
                type="password" 
                placeholder="Master Password" 
                class="bg-gray-800 border-gray-700 text-center text-lg" 
                @keyup.enter="handleAuth"
              />
              <p v-if="authError" class="text-red-400 text-xs flex items-center justify-center gap-1">
                <ShieldAlert class="h-3 w-3" /> Incorrect password. Access denied.
              </p>
              <Button @click="handleAuth" class="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12">
                Unlock Vault
              </Button>
            </div>
          </div>
        </div>

        <!-- Authenticated Content -->
        <div v-else class="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <!-- Add Form Table Style -->
          <div class="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus class="h-4 w-4 text-orange-400" /> Register New Entry
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] text-gray-500 font-bold ml-1">KEY NAME</label>
                <Input v-model="newKey" placeholder="e.g. AWS_SECRET" class="bg-gray-800 border-gray-700 font-mono" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] text-gray-500 font-bold ml-1">VALUE</label>
                <Input v-model="newValue" type="password" placeholder="••••••••" class="bg-gray-800 border-gray-700" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] text-gray-500 font-bold ml-1">CATEGORY</label>
                <select v-model="newCategory" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                  <option value="password">Password</option>
                  <option value="env">ENV Variable</option>
                  <option value="apiKey">API Key</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] text-gray-500 font-bold ml-1">PROJECT SCOPE</label>
                <select v-model="newProjectId" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                  <option value="">Global (Recommended)</option>
                  <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="lg:col-span-3">
                <Input v-model="newDesc" placeholder="Brief description or purpose..." class="bg-gray-800 border-gray-700" />
              </div>
              <Button @click="handleAdd" :disabled="!newKey || !newValue || isAdding" class="bg-orange-600 hover:bg-orange-500 text-white font-bold">
                {{ isAdding ? 'Storing...' : 'Store Secret' }}
              </Button>
            </div>
          </div>

          <!-- Table View -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-800/50 border-b border-gray-700">
                  <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Entry</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Scope</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Value</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Stored</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/50">
                <tr v-if="filteredSecrets.length === 0" class="hover:bg-gray-800/10">
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500 italic">
                    <Database class="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No secrets found. The vault is empty.
                  </td>
                </tr>
                <tr v-for="secret in filteredSecrets" :key="secret.id" class="hover:bg-gray-800/30 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-gray-100 font-mono">{{ secret.key }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter"
                          :class="{
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20': secret.category === 'password',
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': secret.category === 'env',
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20': secret.category === 'apiKey',
                          }">
                          {{ secret.category }}
                        </span>
                      </div>
                      <span class="text-[10px] text-gray-500 mt-1 line-clamp-1 italic max-w-xs">{{ secret.description || 'No description' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-medium" :class="secret.projectId ? 'text-indigo-400' : 'text-gray-500'">
                      {{ getProjectName(secret.projectId) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 min-w-[300px]">
                    <div class="flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2 w-full max-w-sm">
                      <component 
                        :is="showValues[secret.id] ? EyeOff : Eye" 
                        @click="toggleValue(secret.id)" 
                        class="h-4 w-4 text-gray-500 hover:text-orange-400 cursor-pointer transition-colors flex-shrink-0" 
                      />
                      <span class="flex-1 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                        <template v-if="showValues[secret.id]">{{ secret.value }}</template>
                        <template v-else><span class="text-gray-600 tracking-widest select-none">••••••••••••••••</span></template>
                      </span>
                      <button 
                        @click="copyToClipboard(secret.value, secret.id)"
                        class="text-[10px] font-bold transition-all px-2 py-1 rounded"
                        :class="copiedId === secret.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-orange-400 hover:bg-orange-500/10'"
                      >
                        <template v-if="copiedId === secret.id">
                           <CheckCircle2 class="h-3 w-3 inline mr-1" /> Copied
                        </template>
                        <template v-else>
                           <Copy class="h-3 w-3 inline mr-1" /> Copy
                        </template>
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-[10px] text-gray-500 font-mono">{{ new Date(secret.createdAt).toLocaleDateString() }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="handleDelete(secret.id, secret.key)" class="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
</style>
