<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

const providerDefaults = {
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  gemini: { baseURL: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash' },
  kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  ollama: { baseURL: 'http://localhost:11434', model: 'llama3.1' },
  generic: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
} as const

const getProviderDefaults = (provider: string) => {
  return providerDefaults[provider as keyof typeof providerDefaults] || providerDefaults.openai
}

const settings = ref<LLMSettings>({
  provider: 'openai',
  apiKey: '',
  model: getProviderDefaults('openai').model,
  baseURL: getProviderDefaults('openai').baseURL
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

watch(
  () => settings.value.provider,
  (nextProvider, previousProvider) => {
    const nextDefaults = getProviderDefaults(nextProvider)
    const previousDefaults = getProviderDefaults(previousProvider || 'openai')

    const isModelCustom = settings.value.model && settings.value.model !== previousDefaults.model
    const isBaseURLCustom = settings.value.baseURL && settings.value.baseURL !== previousDefaults.baseURL

    if (!isModelCustom) {
      settings.value.model = nextDefaults.model
    }

    if (!isBaseURLCustom || /api\.gemini\.com/i.test(settings.value.baseURL)) {
      settings.value.baseURL = nextDefaults.baseURL
    }
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold dark:text-gray-100">LLM Settings</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">Configure your AI provider for project analysis.</p>
      </div>

      <form @submit.prevent="save" class="space-y-4">
        <div class="space-y-2">
          <Label for="provider">Provider</Label>
          <select
            id="provider"
            v-model="settings.provider"
            class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400"
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
