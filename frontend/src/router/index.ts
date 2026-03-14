import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Vault from '../pages/Vault.vue'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/vault', component: Vault },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
