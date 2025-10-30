// src/composables/useSideMenu.js
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { menuController } from '@ionic/vue'
// (opcional) si planeas cerrar sesión desde el menú
// import { useAuth } from '@/composables/useAuth'

export function useSideMenu () {
  const router = useRouter()
  // const { logout } = useAuth()

  const openMenuError = ref(false)
  const optionsError  = ref(false)
  const sectionError  = ref(false)

  // Opciones requeridas (siempre visibles)
  const requiredItems = [
    { label: 'Inicio',        path: '/dashboard'     },
    { label: 'Metas',         path: '/metas'         },
    { label: 'Balance',       path: '/historico'     },
    { label: 'Recordatorios', path: '/recordatorios' },
  ]
  const menuItems = computed(() => {
    const items = requiredItems.filter(Boolean)
    if (items.length !== requiredItems.length) {
      optionsError.value = true
    }
    return items
  })

  // Cerrar el speed-dial de usuario si se abre el menú lateral
  const onSideMenuWillOpen = () => {
    window.dispatchEvent(new CustomEvent('close-user-speed'))
  }

  // Navegar + cerrar menú con manejo de error
  const goTo = async (path) => {
    try {
      await router.push(path)
    } catch (e) {
      sectionError.value = true
    } finally {
      try { await menuController.close('main-menu') } catch {}
    }
  }

  // Si el botón de la topbar no logra abrir el menú, mostrar toast
  onMounted(() => {
    window.addEventListener('menu-open-failed', () => { openMenuError.value = true })
  })

  // (opcional) si quieres exponer logout desde el menú
  // const handleLogout = async () => {
  //   await logout()
  //   await router.replace('/login')
  //   try { await menuController.close('main-menu') } catch {}
  // }

  return {
    menuItems,
    openMenuError,
    optionsError,
    sectionError,
    onSideMenuWillOpen,
    goTo,
    // handleLogout,
  }
}
