<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Loader2 } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import Label from './ui/Label.vue'
import Button from './ui/Button.vue'
import { addProject, analyzeProject } from '../services/api'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'added'): void
}>()

const form = ref({
  name: '',
  description: '',
  path: '',
  tags: '',
  startCommand: ''
})

const analyzing = ref(false)

const handleAnalyze = async () => {
  if (!form.value.path) return
  analyzing.value = true
  try {
    const result = await analyzeProject(form.value.path)
    form.value.name = result.name
    form.value.description = result.description
    form.value.startCommand = result.startCommand
    form.value.tags = result.tags.join(', ')
  } catch (error) {
    console.error('Analysis failed', error)
    alert('AI Analysis failed. Please check your LLM settings.')
  } finally {
    analyzing.value = false
  }
}

const submit = async () => {
  if (!form.value.name || !form.value.path) return
  try {
    const tagsArray = form.value.tags
      ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    await addProject({
      name: form.value.name,
      description: form.value.description,
      path: form.value.path,
      tags: tagsArray,
      startCommand: form.value.startCommand
    })
    
    emit('added')
    emit('update:open', false)
    form.value = { name: '', description: '', path: '', tags: '', startCommand: '' }
  } catch (error) {
    console.error('Failed to add project', error)
    alert('Failed to add project')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold dark:text-gray-100">Add Project</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Register a new local development project.</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div class="space-y-2">
          <Label for="path">Local Path <span class="text-red-500">*</span></Label>
          <div class="flex gap-2">
            <Input id="path" v-model="form.path" placeholder="D:\projects\chat-app" required />
            <Button type="button" variant="outline" @click="handleAnalyze" :disabled="analyzing || !form.path">
              <Loader2 v-if="analyzing" class="h-4 w-4 animate-spin" />
              <Sparkles v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="name">Project Name <span class="text-red-500">*</span></Label>
          <Input id="name" v-model="form.name" placeholder="E.g., Chat App" required />
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Input id="description" v-model="form.description" placeholder="A brief description of the project" />
        </div>

        <div class="space-y-2">
          <Label for="startCommand">Start Command</Label>
          <Input id="startCommand" v-model="form.startCommand" placeholder="e.g. npm run dev" />
        </div>

        <div class="space-y-2">
          <Label for="tags">Tags (comma-separated)</Label>
          <Input id="tags" v-model="form.tags" placeholder="Vue, Node, Socket.io" />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" @click="$emit('update:open', false)">Cancel</Button>
          <Button type="submit">Save Project</Button>
        </div>
      </form>
    </div>
  </Dialog>
</template>
