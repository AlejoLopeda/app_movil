import { createRouter, createWebHistory } from '@ionic/vue-router';
import AddIncomePage from '../views/AddIncomePage.vue'

const routes = [
  {
    path: '/',
    redirect: '/ingresos/nuevo'
  },
  {
    path: '/ingresos/nuevo',
    name: 'AddIncome',
    component: AddIncomePage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
