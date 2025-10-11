import { ref } from 'vue'
import { menuController } from '@ionic/vue'

export function useTopBarMenu (props) {
  const menuOpen = ref(false)
  const logoutErrorOpen = ref(false)

  const toggleUserMenu = async () => {
    if (!menuOpen.value) {
      await menuController.close()
      menuOpen.value = true
    } else {
      menuOpen.value = false
    }
  }

  // ⬇️  try/catch + aviso global si falla
  const onMenuButtonClick = async () => {
    if (menuOpen.value) menuOpen.value = false
    try {
      await menuController.open('main-menu')
    } catch (e) {
      window.dispatchEvent(new CustomEvent('menu-open-failed'))
    }
  }

  const handleLogout = async (fallbackEmit) => {
    if (typeof props.logoutFn === 'function') {
      try { await props.logoutFn() }
      catch (e) { logoutErrorOpen.value = true }
    } else {
      fallbackEmit?.()
    }
  }

  const closeUserSpeed = () => { menuOpen.value = false }
  const handleLogoutFailed = () => { logoutErrorOpen.value = true }

  const wireGlobalEvents = () => {
    window.addEventListener('close-user-speed', closeUserSpeed)
    window.addEventListener('logout-failed', handleLogoutFailed)
  }
  const unwireGlobalEvents = () => {
    window.removeEventListener('close-user-speed', closeUserSpeed)
    window.removeEventListener('logout-failed', handleLogoutFailed)
  }

  return {
    menuOpen,
    logoutErrorOpen,
    toggleUserMenu,
    onMenuButtonClick,
    handleLogout,
    wireGlobalEvents,
    unwireGlobalEvents
  }
}