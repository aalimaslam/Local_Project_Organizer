<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { X, Plus, Trash2, Tag, StickyNote, Pencil, Check } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import type { Note, Label } from '../services/api'
import { fetchNotes, addNote, deleteNote, updateNote } from '../services/api'

const props = defineProps<{
  projectId: string
  projectName: string
  labels: Label[]
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const notes = ref<Note[]>([])
const newContent = ref('')
const selectedLabels = ref<string[]>([])
const loading = ref(false)
const editingId = ref<string | null>(null)
const editContent = ref('')

const load = async () => {
  if (!props.projectId) return
  try {
    notes.value = await fetchNotes(props.projectId)
  } catch (e) {
    console.error('Failed to load notes', e)
  }
}

// Fire both onMounted (component always mounts with open=true) and on any future open change
onMounted(() => { if (props.open) load() })
watch(() => props.open, (val) => { if (val) load() })

const labelMap = computed(() => {
  const m: Record<string, Label> = {}
  props.labels.forEach(l => (m[l.id] = l))
  return m
})

const handleAdd = async () => {
  if (!newContent.value.trim()) return
  loading.value = true
  try {
    const note = await addNote(props.projectId, newContent.value.trim(), selectedLabels.value)
    notes.value.push(note)
    newContent.value = ''
    selectedLabels.value = []
  } finally {
    loading.value = false
  }
}

const handleDelete = async (noteId: string) => {
  await deleteNote(props.projectId, noteId)
  notes.value = notes.value.filter(n => n.id !== noteId)
}

const startEdit = (note: Note) => {
  editingId.value = note.id
  editContent.value = note.content
}

const saveEdit = async (noteId: string) => {
  if (!editContent.value.trim()) return
  const updated = await updateNote(props.projectId, noteId, { content: editContent.value.trim() })
  const idx = notes.value.findIndex(n => n.id === noteId)
  if (idx !== -1) notes.value[idx] = updated
  editingId.value = null
}

const cancelEdit = () => { editingId.value = null }

const toggleLabel = (labelId: string) => {
  if (selectedLabels.value.includes(labelId)) {
    selectedLabels.value = selectedLabels.value.filter(l => l !== labelId)
  } else {
    selectedLabels.value.push(labelId)
  }
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <!-- Overlay -->
  <Transition name="slide-panel">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end" @click.self="emit('close')">
      <div class="w-96 bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl h-full overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <StickyNote class="h-4 w-4 text-indigo-400" />
            <span class="font-semibold text-white text-sm truncate max-w-[200px]">{{ projectName }}</span>
            <span class="text-[10px] bg-indigo-900/60 text-indigo-300 rounded px-1.5 py-0.5">{{ notes.length }} notes</span>
          </div>
          <button @click="emit('close')" class="text-gray-400 hover:text-white transition-colors">
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Notes list -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <div v-if="notes.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <StickyNote class="h-10 w-10 text-gray-600 mb-3" />
            <p class="text-gray-500 text-sm">No notes yet</p>
          </div>

          <div
            v-for="note in notes"
            :key="note.id"
            class="group bg-gray-800 border border-gray-700 rounded-xl p-4 relative hover:border-gray-600 transition-all"
          >
            <!-- Action buttons -->
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button @click="startEdit(note)" v-if="editingId !== note.id" class="text-gray-600 hover:text-indigo-400 transition-colors">
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button @click="handleDelete(note.id)" class="text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Inline edit -->
            <div v-if="editingId === note.id" class="space-y-2">
              <textarea
                v-model="editContent"
                rows="3"
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                @keydown.escape="cancelEdit"
                @keydown.ctrl.enter="saveEdit(note.id)"
                autofocus
              />
              <div class="flex gap-2">
                <button @click="saveEdit(note.id)" class="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"><Check class="h-3 w-3" /> Save</button>
                <button @click="cancelEdit" class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"><X class="h-3 w-3" /> Cancel</button>
              </div>
            </div>
            <p v-else class="text-gray-200 text-sm whitespace-pre-wrap pr-6">{{ note.content }}</p>

            <div class="flex flex-wrap gap-1 mt-2" v-if="note.labels && note.labels.length > 0">
              <span
                v-for="lid in note.labels"
                :key="lid"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                :style="{ backgroundColor: labelMap[lid]?.color + '22', color: labelMap[lid]?.color, border: '1px solid ' + (labelMap[lid]?.color + '44') }"
              >
                <Tag class="h-2.5 w-2.5" />
                {{ labelMap[lid]?.name }}
              </span>
            </div>

            <p class="text-[10px] text-gray-500 mt-2">{{ formatDate(note.createdAt) }}</p>
          </div>
        </div>

        <!-- Add note -->
        <div class="p-4 border-t border-gray-700 bg-gray-900 space-y-3">
          <!-- Label selector -->
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="label in labels"
              :key="label.id"
              @click="toggleLabel(label.id)"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer"
              :style="selectedLabels.includes(label.id)
                ? { backgroundColor: label.color, color: '#fff', border: '1px solid ' + label.color }
                : { backgroundColor: label.color + '18', color: label.color, border: '1px solid ' + label.color + '44' }"
            >
              <Tag class="h-2.5 w-2.5" />
              {{ label.name }}
            </button>
          </div>

          <textarea
            v-model="newContent"
            placeholder="Write a note..."
            rows="3"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            @keydown.ctrl.enter="handleAdd"
          />
          <Button @click="handleAdd" :disabled="loading || !newContent.trim()" class="w-full" size="sm">
            <Plus class="mr-2 h-3.5 w-3.5" />
            Add Note <span class="text-gray-400 text-xs ml-1">(Ctrl+Enter)</span>
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease;
}
.slide-panel-enter-active .w-96,
.slide-panel-leave-active .w-96 {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-panel-enter-from {
  opacity: 0;
}
.slide-panel-leave-to {
  opacity: 0;
}
.slide-panel-enter-from .w-96 {
  transform: translateX(100%);
}
.slide-panel-leave-to .w-96 {
  transform: translateX(100%);
}
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #374151 transparent;
}
</style>
