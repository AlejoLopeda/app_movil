import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthEmailPage from '../views/AuthEmailPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/registro'
  },
  {
    path: '/registro',
    name: 'Register',
    component: AuthEmailPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
