import axios from 'axios'

const api = axios.create({ 
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:6001/api' 
})

// ── Types ──────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  path: string
  tags: string[]
  labels: string[]
  status: string
  startCommand?: string
  pinned?: boolean
  groupName?: string | null
  lastOpened?: string | null
  health?: boolean
  createdAt?: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  content: string
  labels: string[]
  createdAt: string
}

export interface PortEntry {
  id: string
  port: number
  projectId: string | null
  projectName: string
  description: string
  createdAt: string
}

export interface ActivePort {
  port: number
  pid: number
  processName?: string
}

export interface GitInfo {
  branch: string
  hasUncommitted: boolean
  lastCommit: string
}

export interface DashboardStats {
  total: number
  pinned: number
  labeled: number
  groups: number
  withStartCmd: number
  totalNotes: number
  activePorts: number
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

export interface Secret {
  id: string
  key: string
  value: string
  category: string
  projectId: string | null
  description: string
  createdAt: string
}

export interface AnalysisResult {
  name: string
  description: string
  startCommand: string
  tags: string[]
  labels: string[]
}

// ── Projects ───────────────────────────────────────────────

export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get('/projects')
  return data
}

export const fetchGitStatuses = async (): Promise<Record<string, GitInfo>> => {
  const { data } = await api.get('/projects/git')
  return data
}

export const addProject = async (project: Omit<Project, 'id' | 'status'>): Promise<Project> => {
  const { data } = await api.post('/projects', project)
  return data
}

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const { data } = await api.patch(`/projects/${id}`, updates)
  return data
}

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`)
}

// ── Notes ──────────────────────────────────────────────────

export const fetchNotes = async (projectId: string): Promise<Note[]> => {
  const { data } = await api.get(`/projects/${projectId}/notes`)
  return data
}

export const addNote = async (projectId: string, content: string, labels: string[]): Promise<Note> => {
  const { data } = await api.post(`/projects/${projectId}/notes`, { content, labels })
  return data
}

export const updateNote = async (projectId: string, noteId: string, updates: Partial<Note>): Promise<Note> => {
  const { data } = await api.patch(`/projects/${projectId}/notes/${noteId}`, updates)
  return data
}

export const deleteNote = async (projectId: string, noteId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}/notes/${noteId}`)
}

// ── Labels ─────────────────────────────────────────────────

export const fetchLabels = async (): Promise<Label[]> => {
  const { data } = await api.get('/labels')
  return data
}

export const createLabel = async (name: string, color: string): Promise<Label> => {
  const { data } = await api.post('/labels', { name, color })
  return data
}

export const deleteLabel = async (id: string): Promise<void> => {
  await api.delete(`/labels/${id}`)
}

// ── Port Manager ───────────────────────────────────────────

export const fetchPorts = async (): Promise<PortEntry[]> => {
  const { data } = await api.get('/ports')
  return data
}

export const fetchActivePorts = async (): Promise<ActivePort[]> => {
  const { data } = await api.get('/ports/active')
  return data
}

export const addPort = async (entry: Omit<PortEntry, 'id' | 'createdAt'>): Promise<PortEntry> => {
  const { data } = await api.post('/ports', entry)
  return data
}

export const deletePort = async (id: string): Promise<void> => {
  await api.delete(`/ports/${id}`)
}

// ── Stats ──────────────────────────────────────────────────

export const fetchStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/stats')
  return data
}

// ── Run / Open ─────────────────────────────────────────────

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

export const analyzeProjectsBulk = async (paths: string[]): Promise<AnalysisResult[]> => {
  const { data } = await api.post('/analyze-projects-bulk', { paths })
  return data
}

// ── Secrets ──────────────────────────────────────────────────

export const fetchSecrets = async (projectId?: string): Promise<Secret[]> => {
  const { data } = await api.get('/secrets', { params: { projectId } })
  return data
}

export const addSecret = async (secret: Omit<Secret, 'id' | 'createdAt'>): Promise<Secret> => {
  const { data } = await api.post('/secrets', secret)
  return data
}

export const updateSecret = async (id: string, updates: Partial<Secret>): Promise<Secret> => {
  const { data } = await api.patch(`/secrets/${id}`, updates)
  return data
}

export const deleteSecret = async (id: string): Promise<void> => {
  await api.delete(`/secrets/${id}`)
}

export const fetchVaultStatus = async (): Promise<{ initialized: boolean }> => {
  const { data } = await api.get('/vault/status')
  return data
}

export const initVault = async (password: string): Promise<{ message: string }> => {
  const { data } = await api.post('/vault/init', { password })
  return data
}

export const verifyVault = async (password: string): Promise<{ success: boolean }> => {
  const { data } = await api.post('/vault/verify', { password })
  return data
}
