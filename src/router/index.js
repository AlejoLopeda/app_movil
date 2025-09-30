import { createRouter, createWebHistory } from '@ionic/vue-router'
import AuthEmailPage from '../views/AuthEmailPage.vue'
import Inicialmonto from '../views/InicialMontoPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/registro'
  },
  {
    path: '/registro',
    name: 'Register',
    component: AuthEmailPage
  },

  {
    path: '/',
    redirect: '/monto'
  },
  {
    path: '/monto',
    name: 'Monto',
    component: Inicialmonto
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
