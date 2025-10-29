<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar">
      <!-- CTA mode: Add/Edit screens -->
      <div v-if="isAddPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="emitAccept">
          <ion-icon :icon="checkmarkOutline" />
          <span>ACEPTAR</span>
        </button>
      </div>

      <!-- Perfil: volver + actualizar (deshabilitado si no hay cambios) -->
      <div v-else-if="isProfilePage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button
          class="cta-btn"
          :disabled="!canSaveEnabled"
          @click="emitAccept"
        >
          <ion-icon :icon="checkmarkOutline" />
          <span>ACTUALIZAR</span>
        </button>
      </div>

      <!-- Reminders panel: back + create -->
      <div v-else-if="isRemindersPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="goAddReminder">
          <ion-icon :icon="add" />
          <span>CREAR</span>
        </button>
      </div>

      <!-- History mode: back + tabs -->
      <div v-else-if="isHistoryPage" class="nav-history">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='income' }" @click="setHistoryTab('income')">
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='expense' }" @click="setHistoryTab('expense')">
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>
        <button class="cta-btn" :class="{ active: historyTab==='both' }" @click="setHistoryTab('both')">
          <ion-icon :icon="swapHorizontalOutline" />
        </button>
      </div>

      <!-- Normal mode -->
      <nav v-else class="nav nav--cta">
        <button class="nav-btn" :class="{ active: activeTab==='ingresos' }" @click="go('/ingresos')">
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='gastos' }" @click="go('/gastos')">
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='historico' }" @click="goHistory()">
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </nav>
    </ion-toolbar>

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2200" color="danger" @didDismiss="toastOpen=false" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonToolbar, IonIcon, IonToast } from '@ionic/vue'
import { cashOutline, cardOutline, timeOutline, chevronBackOutline, checkmarkOutline, swapHorizontalOutline, add } from 'ionicons/icons'

/* ⬇️ incluye /perfil para que se muestre la barra */
const MAIN_ROUTES = ['/ingresos','/gastos','/historico','/dashboard','/monto','/recordatorios','/historico/ingresos','/historico/gastos','/historico/ambos','/perfil']

const route = useRoute()
const router = useRouter()

const isMainRoute = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))
const isAddIncomePage   = computed(() => route.path === '/ingresos/nuevo')
const isAddExpensePage  = computed(() => route.path === '/gastos/nuevo')
const isAddReminderPage = computed(() => route.path === '/recordatorios/nuevo')
const isEditReminderPage = computed(() => route.name === 'EditReminder')
const isRemindersPage   = computed(() => route.path === '/recordatorios')

/* ⬇️ nuevo flag para perfil */
const isProfilePage = computed(() => route.path.startsWith('/perfil'))

// Single definition after merge
const isAddPage = computed(() => (
  isAddIncomePage.value ||
  isAddExpensePage.value ||
  isAddReminderPage.value ||
  isEditReminderPage.value
))

/* History */
const isHistoryPage = computed(() => route.path.startsWith('/historico'))
const historyTab = computed(() => {
  if (route.path.startsWith('/historico/ingresos')) return 'income'
  if (route.path.startsWith('/historico/gastos'))   return 'expense'
  if (route.path.startsWith('/historico/ambos'))    return 'both'
  const q = String(route.query.tab || 'income')
  return q === 'expense' ? 'expense' : q === 'both' ? 'both' : 'income'
})

const activeTab = computed(() => {
  if (route.path.startsWith('/ingresos')) return 'ingresos'
  if (route.path.startsWith('/gastos'))   return 'gastos'
  if (route.path.startsWith('/historico')) return 'historico'
  return ''
})

/* ===== Habilitación del botón ACTUALIZAR en /perfil ===== */
const canSaveEnabled = ref(false)
function handleCanSave(ev){
  const val = !!ev?.detail?.enabled
  canSaveEnabled.value = val
}
onMounted(() => {
  window.addEventListener('bottom-can-save', handleCanSave)
})
onUnmounted(() => {
  window.removeEventListener('bottom-can-save', handleCanSave)
})
// Si salimos del perfil, resetea estado
watch(isProfilePage, (now) => { if (!now) canSaveEnabled.value = false })

const toastOpen = ref(false)
const toastMsg  = ref('')

async function go(path){
  try{ if(route.path!==path) await router.push(path) } catch{ fail() }
}

function emitAccept(){
  // La pantalla de perfil/otros ya escucha 'bottom-accept'
  window.dispatchEvent(new CustomEvent('bottom-accept'))
}

async function goDashboard(){
  try{
    window.dispatchEvent(new CustomEvent('bottom-back'))
    const target = (isAddReminderPage.value || isEditReminderPage.value) ? '/recordatorios' : '/dashboard'
    await router.replace(target)
  }catch{}
}

async function goAddReminder(){
  try{
    if (route.path !== '/recordatorios/nuevo') await router.push('/recordatorios/nuevo')
  }catch{ fail() }
}

async function goHistory(){
  try{
    const target = '/historico/ingresos'
    if (route.path !== target) await router.push(target)
  }catch{ fail() }
}

async function setHistoryTab(mode){
  try{
    const target = mode==='income' ? '/historico/ingresos' : mode==='expense' ? '/historico/gastos' : '/historico/ambos'
    if (route.path !== target || route.fullPath !== target){ await router.replace(target) }
  }catch{ fail() }
}

function fail(){
  toastMsg.value='No se pudo abrir la sección. Intenta de nuevo.'
  toastOpen.value=true
}
</script>

<style scoped>
.bottom-fixed{ position:fixed; left:0; right:0; bottom:0; z-index:9999; height:calc(var(--bottom-bar-height) + env(safe-area-inset-bottom) + 12px); background:var(--app-topbar-bg,#0d3f48); pointer-events:none; }
.bottombar{ pointer-events:auto; height:var(--bottom-bar-height); padding:8px 14px calc(8px + env(safe-area-inset-bottom)) 14px; --background:transparent; display:grid; align-items:center; }
.nav-cta{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.cta-btn{ height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:6px; padding:0 12px; background:rgba(255,255,255,.12); color:#ffffff; font-weight:600; font-size:12.5px; text-transform:uppercase; letter-spacing:.05em; transition:background .2s, opacity .2s; text-align:center; }
.cta-btn ion-icon{ font-size:19px; }
.cta-btn:hover{ background:rgba(255,255,255,.22); }
/* ⬇️ estado disabled */
.cta-btn[disabled]{
  opacity:.45;
  cursor:not-allowed;
  filter:grayscale(30%);
}
.nav-history{ display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; }
.nav-history .cta-btn{ height:44px; }
.nav-history .cta-btn.active{ background:#ffffff; color:var(--app-topbar-bg,#0d3f48); box-shadow:0 2px 6px rgba(0,0,0,.18); }
.nav{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; background:rgba(255,255,255,.10); border-radius:16px; padding:10px; }
.nav-btn{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:10px 8px; border-radius:12px; background:transparent; color:#fff; font-size:12px; line-height:1.1; letter-spacing:.3px; text-transform:uppercase; white-space:nowrap; transition:background .2s, color .2s, box-shadow .2s; }
.nav-btn ion-icon{ font-size:19px; margin-bottom:2px; }
.nav-btn:hover{ background:rgba(255,255,255,.15); }
.nav-btn.active{ background:#fff; color:var(--app-topbar-bg,#0d3f48); box-shadow:0 2px 6px rgba(0,0,0,.18); }
.nav--cta{ background:transparent; padding:0; gap:10px; }
.nav--cta .nav-btn{ height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:6px; padding:0 12px; background:rgba(255,255,255,.12); color:#ffffff; font-weight:600; font-size:12.5px; text-transform:uppercase; letter-spacing:.02em; }
.nav--cta .nav-btn ion-icon{ font-size:19px; margin:0; }
.nav--cta .nav-btn:hover{ background:rgba(255,255,255,.22); }
.nav--cta .nav-btn.active{ background:#ffffff; color:var(--app-topbar-bg,#0d3f48); box-shadow:0 2px 6px rgba(0,0,0,.18); }

@media (prefers-color-scheme: dark){
  .cta-btn{ background:rgba(255,255,255,.18); color:#e6f1f3; }
  .cta-btn:hover{ background:rgba(255,255,255,.28); }
  .nav{ background:rgba(255,255,255,.08); }
  .nav-btn{ color:#e6f1f3; }
  .nav-btn:hover{ background:rgba(255,255,255,.18); }
  .nav-btn.active{ background:#e6f1f3; color:var(--app-topbar-bg-dark,#0b2e35); }
  .nav--cta .nav-btn{ background:rgba(255,255,255,.18); color:#e6f1f3; }
  .nav--cta .nav-btn:hover{ background:rgba(255,255,255,.28); }
  .nav--cta .nav-btn.active{ background:#e6f1f3; color:var(--app-topbar-bg-dark,#0b2e35); }
}
</style>
