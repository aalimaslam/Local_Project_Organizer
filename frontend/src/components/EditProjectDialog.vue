<script setup lang="ts">
import { ref, watch } from 'vue'
import { Tag, Loader2, Sparkles } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import Label from './ui/Label.vue'
import Button from './ui/Button.vue'
import { updateProject, analyzeProject } from '../services/api'
import type { Project, Label as LabelType } from '../services/api'

const props = defineProps<{
  open: boolean
  project: Project | null
  labels: LabelType[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'updated', project: Project): void
}>()

const form = ref({
  name: '',
  description: '',
  startCommand: '',
  tags: '',
  pinned: false,
  groupName: '',
  selectedLabels: [] as string[],
})

const analyzing = ref(false)

// Sync form with project prop
watch(() => props.project, (p) => {
  if (p) {
    form.value = {
      name: p.name,
      description: p.description,
      startCommand: p.startCommand || '',
      tags: (p.tags || []).join(', '),
      pinned: p.pinned || false,
      groupName: p.groupName || '',
      selectedLabels: [...(p.labels || [])],
    }
  }
}, { immediate: true })

const toggleLabel = (id: string) => {
  if (form.value.selectedLabels.includes(id)) {
    form.value.selectedLabels = form.value.selectedLabels.filter(l => l !== id)
  } else {
    form.value.selectedLabels.push(id)
  }
}

const handleAnalyze = async () => {
  if (!props.project?.path) return
  analyzing.value = true
  try {
    const result = await analyzeProject(props.project.path)
    form.value.name = result.name || form.value.name
    form.value.description = result.description || form.value.description
    form.value.startCommand = result.startCommand || form.value.startCommand
    form.value.tags = result.tags?.join(', ') || form.value.tags
    if (result.labels?.length) {
      form.value.selectedLabels = [...new Set([...form.value.selectedLabels, ...result.labels])]
    }
  } catch (e: any) {
    alert('AI Analysis failed: ' + e.message)
  } finally {
    analyzing.value = false
  }
}

const submit = async () => {
  if (!props.project || !form.value.name) return
  try {
    const tagsArray = form.value.tags
      ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const updated = await updateProject(props.project.id, {
      name: form.value.name,
      description: form.value.description,
      startCommand: form.value.startCommand,
      tags: tagsArray,
      labels: form.value.selectedLabels,
      pinned: form.value.pinned,
      groupName: form.value.groupName || null,
    })

    emit('updated', updated)
    emit('update:open', false)
  } catch (e) {
    console.error('Failed to update project', e)
    alert('Failed to update project')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-5 w-full max-w-lg" v-if="project">
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-100">Edit Project</h2>
          <Button type="button" variant="outline" size="sm" @click="handleAnalyze" :disabled="analyzing" title="Re-analyze with AI">
            <Loader2 v-if="analyzing" class="h-3.5 w-3.5 animate-spin" />
            <Sparkles v-else class="h-3.5 w-3.5 text-indigo-400" />
            <span class="ml-1.5 text-xs">AI Refill</span>
          </Button>
        </div>
        <p class="text-xs text-gray-500 font-mono truncate">{{ project.path }}</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div class="space-y-2">
          <Label for="edit-name">Project Name <span class="text-red-500">*</span></Label>
          <Input id="edit-name" v-model="form.name" placeholder="Project name" required />
        </div>

        <div class="space-y-2">
          <Label for="edit-desc">Description</Label>
          <textarea
            id="edit-desc"
            v-model="form.description"
            rows="3"
            placeholder="Brief description of this project"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div class="space-y-2">
          <Label for="edit-cmd">Start Command</Label>
          <Input id="edit-cmd" v-model="form.startCommand" placeholder="e.g. npm run dev" class="font-mono text-sm" />
        </div>

        <div class="space-y-2">
          <Label for="edit-tags">Tags (comma-separated)</Label>
          <Input id="edit-tags" v-model="form.tags" placeholder="Vue, Node, Python" />
        </div>

        <div class="space-y-2">
          <Label for="edit-group">Group Name</Label>
          <Input id="edit-group" v-model="form.groupName" placeholder="e.g. Wasla Projects" />
        </div>

        <!-- Labels -->
        <div class="space-y-2" v-if="labels.length > 0">
          <Label>Labels</Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="label in labels"
              :key="label.id"
              type="button"
              @click="toggleLabel(label.id)"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
              :style="form.selectedLabels.includes(label.id)
                ? { backgroundColor: label.color, color: '#fff', border: '1px solid ' + label.color }
                : { backgroundColor: label.color + '18', color: label.color, border: '1px solid ' + label.color + '44' }"
            >
              <Tag class="h-3 w-3" />
              {{ label.name }}
            </button>
          </div>
        </div>

        <!-- Pinned toggle -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="form.pinned = !form.pinned"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            :class="form.pinned ? 'bg-indigo-600' : 'bg-gray-700'"
          >
            <span
              class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
              :class="form.pinned ? 'translate-x-4' : 'translate-x-1'"
            />
          </button>
          <span class="text-sm text-gray-300">Pinned</span>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button variant="outline" type="button" @click="$emit('update:open', false)">Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  </Dialog>
</template>
