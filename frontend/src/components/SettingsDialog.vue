<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import Label from './ui/Label.vue'
import Button from './ui/Button.vue'
import { fetchSettings, updateSettings, type LLMSettings } from '../services/api'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const settings = ref<LLMSettings>({
  provider: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  baseURL: 'https://api.openai.com/v1'
})

const loading = ref(false)

const loadSettings = async () => {
  try {
    const data = await fetchSettings()
    settings.value = data
  } catch (error) {
    console.error('Failed to load settings', error)
  }
}

const save = async () => {
  loading.value = true
  try {
    await updateSettings(settings.value)
    emit('update:open', false)
  } catch (error) {
    console.error('Failed to save settings', error)
    alert('Failed to save settings')
  } finally {
    loading.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold dark:text-gray-100">LLM Settings</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Configure your AI provider for project analysis.</p>
      </div>

      <form @submit.prevent="save" class="space-y-4">
        <div class="space-y-2">
          <Label for="provider">Provider</Label>
          <select
            id="provider"
            v-model="settings.provider"
            class="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="kimi">Kimi</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="generic">Generic OpenAI-Compatible</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="baseURL">Base URL</Label>
          <Input id="baseURL" v-model="settings.baseURL" placeholder="https://api.openai.com/v1" />
        </div>

        <div class="space-y-2">
          <Label for="apiKey">API Key</Label>
          <Input id="apiKey" v-model="settings.apiKey" type="password" placeholder="sk-..." />
        </div>

        <div class="space-y-2">
          <Label for="model">Model</Label>
          <Input id="model" v-model="settings.model" placeholder="gpt-3.5-turbo" />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" @click="$emit('update:open', false)">Cancel</Button>
          <Button type="submit" :disabled="loading">Save Settings</Button>
        </div>
      </form>
    </div>
  </Dialog>
</template>
