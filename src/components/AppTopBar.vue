<template>
  <ion-header translucent class="topbar">
    <ion-toolbar class="topbar__toolbar">
      <!-- Menú -->
      <ion-buttons slot="start">
        <ion-menu-button class="topbar__btn" @click="onMenuButtonClick" />
      </ion-buttons>

      <!-- Título centrado (reactivo al meta.title de la ruta) -->
      <ion-title class="topbar__title">{{ routeTitle }}</ion-title>

      <!-- Usuario: botón con avatar grande -->
      <ion-buttons slot="end">
        <ion-button
          class="topbar__btn topbar__user-btn"
          @click="toggleUserMenu"
          :aria-label="`Menú de ${firstNameUpper}`"
        >
          <ion-avatar class="topbar__avatar">
            <img :src="avatarSrc" alt="Avatar" />
          </ion-avatar>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Speed-dial + overlay -->
    <UserSpeedDial
      :open="menuOpen"
      @close="menuOpen=false"
      @edit="onEdit"
      @report="onReport"
      @logout="onLogout"
    />

    <!-- Toast error logout -->
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

const AVATAR_BUCKET = 'avatars'

const props = defineProps({
  title: { type: String, default: 'INGRESOS' },
  fullName: { type: String, default: '' },
  logoutFn: { type: Function, default: null },
  // Puede venir una URL completa o una ruta interna del bucket (opcional)
  avatarUrl: { type: String, default: '' },
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

const routeTitle = computed(() => route.meta?.title || props.title)

const firstNameUpper = computed(() => {
  const raw = (props.fullName || '').trim()
  const first = raw ? (raw.split(/\s+/)[0] || 'Usuario') : 'Usuario'
  return first.toUpperCase()
})

/* ---------- Avatar desde DB (profile_extras) + firmado si es ruta ---------- */
const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=64'
const dbAvatarPath = ref('')   // lo que venga de profile_extras.avatar_url (puede ser ruta de bucket)
const resolvedUrl = ref('')    // URL final (http) para <img>

/** Lee el avatar del usuario actual desde profile_extras */
async function loadAvatarFromDB () {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) { dbAvatarPath.value = ''; return }

    const { data, error } = await supabase
      .from('profile_extras')
      .select('avatar_url')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    dbAvatarPath.value = (data?.avatar_url || '').trim()
  } catch (e) {
    console.error('No se pudo leer avatar_url:', e?.message || e)
    dbAvatarPath.value = ''
  }
}

/** Dado un valor (URL absoluta o ruta del bucket), resuelve a una URL http usable */
async function toHttpUrl (value) {
  const v = (value || '').trim()
  if (!v) return ''

  // Si ya es URL absoluta, devuélvela
  if (/^https?:\/\//i.test(v)) return v

  // Si es ruta del bucket, crear signed URL
  try {
    const { data, error } = await supabase
      .storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(v, 60 * 60 * 24 * 7) // 7 días
    if (error) throw error
    return data?.signedUrl || ''
  } catch (e) {
    console.error('No se pudo firmar el avatar:', e?.message || e)
    return ''
  }
}

/** Resuelve prioridad: prop.avatarUrl > DB.profile_extras > default */
async function resolveAvatar () {
  const candidate = (props.avatarUrl || dbAvatarPath.value || '').trim()
  resolvedUrl.value = await toHttpUrl(candidate)
}

/* Inicializa y reacciona a cambios */
onMounted(async () => {
  await loadAvatarFromDB()
  await resolveAvatar()
})
watch([() => props.avatarUrl, dbAvatarPath], resolveAvatar)

const avatarSrc = computed(() => resolvedUrl.value || DEFAULT_AVATAR)

/* ---------- Acciones ---------- */
async function onEdit ()  {
  menuOpen.value = false
  try { await router.push('/perfil') } catch {}
}
function onReport(){ menuOpen.value = false; emit('report') }
async function onLogout(){
  menuOpen.value = false
  await handleLogout(() => emit('logout'))
}

onMounted(() => { wireGlobalEvents() })
onUnmounted(() => { unwireGlobalEvents() })
</script>

<!-- Estilos globales ya los cargas en AppTopBar.css -->
<style src="../theme/AppTopBar.css"></style>