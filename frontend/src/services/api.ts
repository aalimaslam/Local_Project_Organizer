import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:6001'
})

export interface Project {
  id: string
  name: string
  description: string
  path: string
  tags: string[]
  status: string
  startCommand?: string
}

export interface LLMSettings {
  provider: string
  apiKey: string
  model: string
  baseURL: string
}

export interface ScanResult {
  name: string
  path: string
}

export interface AnalysisResult {
  name: string
  description: string
  startCommand: string
  tags: string[]
}

export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get('/projects')
  return data
}

export const addProject = async (project: Omit<Project, 'id' | 'status'>): Promise<Project> => {
  const { data } = await api.post('/projects', project)
  return data
}

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`)
}

export const runProject = async (path: string, startCommand?: string): Promise<{ message: string }> => {
  const { data } = await api.post('/run', { path, startCommand })
  return data
}

export const openVSCode = async (path: string): Promise<{ message: string }> => {
  const { data } = await api.post('/open-vscode', { path })
  return data
}

export const openFolder = async (path: string): Promise<{ message: string }> => {
  const { data } = await api.post('/open-folder', { path })
  return data
}

export const fetchSettings = async (): Promise<LLMSettings> => {
  const { data } = await api.get('/settings')
  return data
}

export const updateSettings = async (settings: LLMSettings): Promise<void> => {
  await api.post('/settings', settings)
}

export const scanDirectory = async (path: string): Promise<ScanResult[]> => {
  const { data } = await api.get('/scan-dir', { params: { path } })
  return data
}

export const analyzeProject = async (path: string): Promise<AnalysisResult> => {
  const { data } = await api.post('/analyze-project', { path })
  return data
}
