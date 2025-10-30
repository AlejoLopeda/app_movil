<template>
  <ion-header class="topbar">
    <!-- Barra negra SIEMPRE visible arriba -->
    <div class="topbar__notch" aria-hidden="true"></div>

    <ion-toolbar :class="['topbar__toolbar', { 'topbar__toolbar--twoline': titleHasTwoLines }]">
      <!-- Menú -->
      <ion-buttons slot="start">
        <ion-menu-button class="topbar__btn" @click="onMenuButtonClick" />
      </ion-buttons>

      <!-- Título -->
      <ion-title class="topbar__title">
        <div class="topbar__title-inner">
          <span class="topbar__title-line1">{{ titleLines[0] }}</span>
          <span v-if="titleHasTwoLines" class="topbar__title-line2">{{ titleLines[1] }}</span>
        </div>
      </ion-title>

      <!-- Usuario -->
      <ion-buttons slot="end">
        <ion-button
          class="topbar__btn topbar__user-btn"
          @click="handleUserMenu"
          :aria-label="`Menú de ${firstNameUpper}`"
        >
          <ion-avatar class="topbar__avatar" :class="{ 'is-loading': !avatarSrc }">
            <div v-if="!avatarSrc" class="topbar__avatar-skel"></div>
            <img v-else :src="avatarSrc" alt="Avatar" />
          </ion-avatar>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- No renderizar el menú cuando estamos en /perfil -->
    <UserSpeedDial
      v-if="!isProfilePage"
      :open="menuOpen"
      @close="menuOpen=false"
      @edit="onEdit"
      @report="onReport"
      @logout="onLogout"
    />

    <ion-toast
      :is-open="logoutErrorOpen"
      message="No se pudo cerrar sesión. Intenta de nuevo."
      color="danger"
      duration="3000"
      @didDismiss="logoutErrorOpen=false"
    />
  </ion-header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonAvatar, IonToast
} from '@ionic/vue'
import UserSpeedDial from './UserSpeedDial.vue'
import { useTopBarMenu } from '@/composables/useTopBarMenu'
import { supabase } from '@/lib/supabaseClient'

/* ===== Constantes ===== */
const AVATAR_BUCKET = 'avatars'
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7     // 7 días
const CACHE_GRACE_SECONDS = 60 * 10           // 10 min

const props = defineProps({
  title: { type: String, default: 'INGRESOS' },
  fullName: { type: String, default: '' },
  logoutFn: { type: Function, default: null },
  avatarUrl: { type: String, default: '' },   // pública o vacía
})
const emit = defineEmits(['edit', 'report', 'logout'])

const {
  menuOpen,
  logoutErrorOpen,
  toggleUserMenu,
  onMenuButtonClick,
  handleLogout,
  wireGlobalEvents,
  unwireGlobalEvents
} = useTopBarMenu(props)

const route = useRoute()
const router = useRouter()

/* ===== Título / ruta ===== */
const isProfilePage = computed(() => route.path.startsWith('/perfil'))
const routeTitle = computed(() => (route.meta?.title || props.title || '').trim())
const titleLines = computed(() => {
  const t = routeTitle.value
  const i = t.indexOf(' ')
  return i === -1 ? [t] : [t.slice(0, i), t.slice(i + 1)]
})
const titleHasTwoLines = computed(() => titleLines.value.length > 1)
const firstNameUpper = computed(() => {
  const raw = (props.fullName || '').trim()
  const first = raw ? (raw.split(/\s+/)[0] || 'Usuario') : 'Usuario'
  return first.toUpperCase()
})

/* ===== Avatar: cache + firma + preload ===== */
const avatarSrc = ref('')     // URL efectiva para <img>
const dbAvatarPath = ref('')  // ruta bucket o URL pública desde DB
const cacheKey = (userId) => `avatar:v1:${userId}`

async function readAvatarPathFromDB () {
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id
  if (!userId) return { userId: null, path: '' }

  const { data, error } = await supabase
    .from('profile_extras')
    .select('avatar_url')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return { userId, path: (data?.avatar_url || '').trim() }
}

function preload(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = reject
    img.src = src
  })
}

async function signIfNeeded(value) {
  const v = (value || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET)
    .createSignedUrl(v, SIGN_TTL_SECONDS)
  if (error) throw error
  return data?.signedUrl || ''
}

/** Carga el avatar desde cache/DB. Si force=true ignora cache y renueva firma. */
async function loadAvatar(force = false) {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) { avatarSrc.value = ''; return }

    const now = Math.floor(Date.now()/1000)
    const cachedRaw = localStorage.getItem(cacheKey(userId))

    // 1) Cache inmediata (si no forzamos y no está por expirar)
    if (!force && cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw)
        if (cached?.signedUrl && cached?.exp && (cached.exp - now) > CACHE_GRACE_SECONDS) {
          await preload(cached.signedUrl).catch(() => {})
          avatarSrc.value = cached.signedUrl
        }
      } catch {}
    }

    // 2) DB / prop → firmar
    const fromDB = await readAvatarPathFromDB()
    dbAvatarPath.value = fromDB.path
    const candidate = (props.avatarUrl || dbAvatarPath.value || '').trim()
    if (!candidate) { avatarSrc.value = ''; return }

    const needsRefresh =
      force ||
      !avatarSrc.value ||
      (cachedRaw ? (() => { try {
          const c = JSON.parse(cachedRaw); return (c.exp - now) <= CACHE_GRACE_SECONDS
        } catch { return true } })()
        : true)

    if (needsRefresh) {
      const signed = await signIfNeeded(candidate)
      if (signed) {
        await preload(signed).catch(() => {})
        avatarSrc.value = signed
        localStorage.setItem(cacheKey(userId), JSON.stringify({
          signedUrl: signed,
          exp: now + SIGN_TTL_SECONDS
        }))
      }
    }
  } catch (e) {
    console.error('Avatar load error:', e?.message || e)
    avatarSrc.value = ''
  }
}

/* ===== Listeners para refrescar al instante ===== */

/** Perfil debe disparar: window.dispatchEvent(new CustomEvent('avatar-updated', { detail:{ userId, path, signedUrl } })) */
function onAvatarUpdated (ev) {
  const detail = ev?.detail || {}
  const { userId, signedUrl } = detail || {}

  // 1) Mostrar YA la nueva imagen si nos pasaron la firmada
  if (signedUrl) {
    // preload para evitar parpadeo
    preload(signedUrl).catch(() => {})
    avatarSrc.value = signedUrl
  }

  // 2) Actualizar caché para todas las vistas/componentes
  if (userId && signedUrl) {
    const now = Math.floor(Date.now()/1000)
    localStorage.setItem(cacheKey(userId), JSON.stringify({
      signedUrl,
      exp: now + SIGN_TTL_SECONDS
    }))
  }

  // 3) Revalidar contra DB en background (por si cambió la ruta)
  loadAvatar(true).catch(() => {})
}

/** Si otro componente cambia el localStorage, nos enteramos y recargamos */
async function onStorage (e) {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return
    if (e.key === cacheKey(userId)) {
      loadAvatar(true)
    }
  } catch {}
}

/* ===== Acciones ===== */
async function onEdit ()  { menuOpen.value = false; try { await router.push('/perfil') } catch {} }
function onReport(){ menuOpen.value = false; emit('report') }
async function onLogout(){ menuOpen.value = false; await handleLogout(() => emit('logout')) }
function handleUserMenu () { if (isProfilePage.value) return; toggleUserMenu() }

/* ===== Lifecycle ===== */
onMounted(async () => {
  await loadAvatar()
  window.addEventListener('avatar-updated', onAvatarUpdated)
  window.addEventListener('storage', onStorage)
  wireGlobalEvents()
})
onUnmounted(() => {
  window.removeEventListener('avatar-updated', onAvatarUpdated)
  window.removeEventListener('storage', onStorage)
  unwireGlobalEvents()
})

// Si cambian props.avatarUrl, renovamos
watch(() => props.avatarUrl, () => loadAvatar(true))
// (opcional) al cambiar de ruta también podemos intentar revalidar
watch(() => route.fullPath, () => loadAvatar(false))
</script>

<style src="../theme/AppTopBar.css"></style>
