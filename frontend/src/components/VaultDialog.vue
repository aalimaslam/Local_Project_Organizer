<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Key, Eye, EyeOff, Plus, Trash2, Lock, ShieldCheck, Search, Database } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import { fetchSecrets, addSecret, deleteSecret, type Secret, type Project } from '../services/api'

const props = defineProps<{
  open: boolean
  projects: Project[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const secrets = ref<Secret[]>([])
const loading = ref(false)
const search = ref('')
const showValues = ref<Record<string, boolean>>({})

// Form state
const newKey = ref('')
const newValue = ref('')
const newCategory = ref('password')
const newProjectId = ref<string>('')
const newDesc = ref('')
const isAdding = ref(false)

const loadSecrets = async () => {
  loading.value = true
  try {
    secrets.value = await fetchSecrets()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.open) loadSecrets()
})

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

const getProjectName = (id: string | null) => {
  if (!id) return 'Global'
  return props.projects.find(p => p.id === id)?.name || 'Unknown'
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6 max-w-3xl w-full">
      <div class="flex items-center justify-between border-b border-gray-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <ShieldCheck class="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-100 italic tracking-tight">Secret Vault</h2>
            <p class="text-xs text-gray-400">Securely store passwords, API keys, and environment variables.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
           <div class="relative">
             <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
             <input v-model="search" placeholder="Search secrets..." class="bg-gray-800 border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 w-48" />
           </div>
        </div>
      </div>

      <!-- Add Secret Form -->
      <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700 grid grid-cols-2 gap-3 group">
        <div class="col-span-2 flex items-center gap-2 mb-1">
          <Plus class="h-3.5 w-3.5 text-orange-400" />
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Register New Secret</span>
        </div>
        <Input v-model="newKey" placeholder="Key (e.g. STRIPE_API_KEY)" class="bg-gray-900 border-gray-700" />
        <Input v-model="newValue" type="password" placeholder="Value" class="bg-gray-900 border-gray-700" />
        <select v-model="newCategory" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="password">Password</option>
          <option value="env">ENV Variable</option>
          <option value="apiKey">API Key</option>
          <option value="other">Other</option>
        </select>
        <select v-model="newProjectId" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500">
          <option value="">Global (All Projects)</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <div class="col-span-2 flex gap-2">
          <Input v-model="newDesc" placeholder="Brief description or hint..." class="flex-1 bg-gray-900 border-gray-700" />
          <Button @click="handleAdd" :disabled="isAdding || !newKey || !newValue" class="bg-orange-600 hover:bg-orange-500 text-white border-0 px-6">
            Store
          </Button>
        </div>
      </div>

      <!-- Secrets List -->
      <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div v-if="filteredSecrets.length === 0" class="text-center py-10 text-gray-500 flex flex-col items-center">
          <Database class="h-10 w-10 opacity-20 mb-2" />
          <p class="text-sm">No secrets found matching your search.</p>
        </div>
        
        <div v-for="secret in filteredSecrets" :key="secret.id" class="group flex flex-col p-3 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-orange-950/5">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" 
                :class="{
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20': secret.category === 'password',
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': secret.category === 'env',
                  'bg-purple-500/10 text-purple-400 border border-purple-500/20': secret.category === 'apiKey',
                }">
                {{ secret.category }}
              </span>
              <span class="text-xs font-mono font-bold text-gray-200">{{ secret.key }}</span>
              <span class="text-[10px] text-gray-500">•</span>
              <span class="text-[10px] text-orange-400/80 font-medium">{{ getProjectName(secret.projectId) }}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="handleDelete(secret.id, secret.key)" class="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-3 bg-black/40 rounded px-2.5 py-2 border border-white/5">
            <component :is="showValues[secret.id] ? EyeOff : Eye" @click="toggleValue(secret.id)" class="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-300 transition-colors" />
            <div class="flex-1 font-mono text-xs">
              <span v-if="showValues[secret.id]" class="text-orange-200 select-all">{{ secret.value }}</span>
              <span v-else class="text-gray-600 tracking-[0.3em]">••••••••••••</span>
            </div>
            <button @click="navigator.clipboard.writeText(secret.value)" class="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wide">Copy</button>
          </div>
          
          <p v-if="secret.description" class="mt-2 text-[10px] text-gray-500 italic">{{ secret.description }}</p>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
</style>
