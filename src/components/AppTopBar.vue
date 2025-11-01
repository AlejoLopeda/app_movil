<template>
  <ion-header class="topbar" ref="topbarRef">
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
      :message="logoutMsg"
      color="danger"
      duration="3000"
      @didDismiss="logoutErrorOpen=false"
    />
  </ion-header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonAvatar, IonToast
} from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import UserSpeedDial from './UserSpeedDial.vue'
import { useTopBarMenu } from '@/composables/useTopBarMenu'
import { supabase } from '@/lib/supabaseClient'

const AVATAR_BUCKET = 'avatars'
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7
const CACHE_GRACE_SECONDS = 60 * 10

const props = defineProps({
  title: { type: String, default: 'INGRESOS' },
  fullName: { type: String, default: '' },
  logoutFn: { type: Function, default: null },
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

const avatarSrc = ref('')
const dbAvatarPath = ref('')
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
function preload(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(src); i.onerror=rej; i.src=src }) }
async function signIfNeeded(v){ const s=(v||'').trim(); if(!s) return ''; if(/^https?:\/\//i.test(s)) return s; const {data,e}=await supabase.storage.from('avatars').createSignedUrl(s,SIGN_TTL_SECONDS); if(e) throw e; return data?.signedUrl||'' }

async function loadAvatar(force=false){
  try{
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) { avatarSrc.value=''; return }
    const now = Math.floor(Date.now()/1000)
    const cachedRaw = localStorage.getItem(cacheKey(userId))
    if(!force && cachedRaw){
      try{ const c=JSON.parse(cachedRaw); if(c?.signedUrl && c?.exp && (c.exp-now)>CACHE_GRACE_SECONDS){ await preload(c.signedUrl).catch(()=>{}); avatarSrc.value=c.signedUrl } }catch{}
    }
    const { path } = await readAvatarPathFromDB()
    dbAvatarPath.value = path
    const candidate = (props.avatarUrl || dbAvatarPath.value || '').trim()
    if(!candidate){ avatarSrc.value=''; return }
    const needsRefresh = force || !avatarSrc.value || (()=>{ try{ const c=JSON.parse(cachedRaw); return (c.exp-now)<=CACHE_GRACE_SECONDS }catch{return true} })()
    if(needsRefresh){
      const signed = await signIfNeeded(candidate)
      if(signed){ await preload(signed).catch(()=>{}); avatarSrc.value=signed; localStorage.setItem(cacheKey(userId), JSON.stringify({ signedUrl:signed, exp: now+SIGN_TTL_SECONDS })) }
    }
  }catch(e){ console.error('Avatar load error:', e?.message||e); avatarSrc.value='' }
}

function onAvatarUpdated(ev){
  const { userId, signedUrl } = ev?.detail||{}
  if(signedUrl){ preload(signedUrl).catch(()=>{}); avatarSrc.value=signedUrl }
  if(userId && signedUrl){ const now=Math.floor(Date.now()/1000); localStorage.setItem(cacheKey(userId), JSON.stringify({ signedUrl:signedUrl, exp: now+SIGN_TTL_SECONDS })) }
  loadAvatar(true).catch(()=>{})
}
async function onStorage(e){
  try{ const { data: authData } = await supabase.auth.getUser(); const userId = authData?.user?.id; if(!userId) return; if(e.key===cacheKey(userId)) loadAvatar(true) }catch{}
}

async function onEdit(){ menuOpen.value=false; try{ await router.push('/perfil') }catch{} }
function onReport(){ menuOpen.value=false; emit('report') }

const logoutMsg = ref('No se pudo cerrar la app. Intenta de nuevo.')
async function onLogout(){
  menuOpen.value=false
  try{
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform()==='android'){ await CapApp.exitApp(); return }
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform()==='ios'){ logoutMsg.value='En iOS no es posible cerrar la app automáticamente. Usa el gesto de Home.'; return (logoutErrorOpen.value=true) }
    const closed = window.close()
    if(!closed){ logoutMsg.value='No es posible cerrar la ventana desde el navegador. Ciérrala manualmente.'; logoutErrorOpen.value=true }
  }catch(e){ console.error('close app error:', e); logoutMsg.value='No se pudo cerrar la app. Intenta de nuevo.'; logoutErrorOpen.value=true }
}

/* ✅ Ajuste para que el speed-dial nunca quede pegado al avatar
   (recalcula altura real del header justo antes de abrir el menú) */
function handleUserMenu(){
  if (isProfilePage.value) return
  // Recalcular altura del header y actualizar la variable CSS usada por el menú
  nextTick(() => {
    applyTopbarHeight()
    // doble raf por si Ionic está terminando un reflow del header
    requestAnimationFrame(applyTopbarHeight)
  })
  toggleUserMenu()
}

/* ======= Medición dinámica de la altura del header ======= */
const topbarRef = ref(null)
let resizeObs = null
function applyTopbarHeight(){
  const h = topbarRef.value?.$el?.offsetHeight || topbarRef.value?.offsetHeight || 0
  document.documentElement.style.setProperty('--topbar-height', `${Math.max(0,h)}px`)
}
onMounted(async ()=>{
  await loadAvatar()
  window.addEventListener('avatar-updated', onAvatarUpdated)
  window.addEventListener('storage', onStorage)
  wireGlobalEvents()

  await nextTick()
  applyTopbarHeight()
  try{
    resizeObs = new ResizeObserver(()=>applyTopbarHeight())
    const el = topbarRef.value?.$el || topbarRef.value
    if(el) resizeObs.observe(el)
  }catch{}
  window.addEventListener('resize', applyTopbarHeight, { passive:true })
})
onUnmounted(()=>{
  window.removeEventListener('avatar-updated', onAvatarUpdated)
  window.removeEventListener('storage', onStorage)
  unwireGlobalEvents()
  window.removeEventListener('resize', applyTopbarHeight)
  try{
    const el = topbarRef.value?.$el || topbarRef.value
    if(resizeObs && el) resizeObs.unobserve(el)
  }catch{}
})
watch(()=>route.fullPath, ()=> nextTick().then(applyTopbarHeight))
watch(titleHasTwoLines, ()=> nextTick().then(applyTopbarHeight))
watch(()=>props.avatarUrl, ()=> loadAvatar(true))
</script>

<style src="../theme/AppTopBar.css"></style>
