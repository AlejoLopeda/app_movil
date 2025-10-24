<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar">
      <!-- Modo especial: Añadir Ingreso o Añadir Gasto -->
      <div v-if="isAddPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="emitAccept">
          <ion-icon :icon="checkmarkOutline" />
          <span>ACEPTAR</span>
        </button>
      </div>

      <!-- Modo especial: Histórico (Dashboard, Ingreso, Gasto, Ambos) -->
      <div v-else-if="isHistoryPage" class="nav-history">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>

        <button
          class="cta-btn"
          :class="{ active: historyTab==='income' }"
          @click="setHistoryTab('income')"
        >
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>

        <button
          class="cta-btn"
          :class="{ active: historyTab==='expense' }"
          @click="setHistoryTab('expense')"
        >
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>

        <button
          class="cta-btn"
          :class="{ active: historyTab==='both' }"
          @click="setHistoryTab('both')"
        >
          <ion-icon :icon="swapHorizontalOutline" />
        </button>
      </div>

      <!-- Modo normal: 3 pestañas (con estilo de botones CTA) -->
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

    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="2200"
      color="danger"
      @didDismiss="toastOpen=false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonToolbar, IonIcon, IonToast } from '@ionic/vue'
import {
  cashOutline, cardOutline, timeOutline,
  chevronBackOutline, checkmarkOutline,
  swapHorizontalOutline
} from 'ionicons/icons'

const MAIN_ROUTES = ['/ingresos','/gastos','/historico','/dashboard','/monto','/recordatorios','/historico/ingresos','/historico/gastos']

const route = useRoute()
const router = useRouter()

const isMainRoute = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))
const isAddIncomePage   = computed(() => route.path === '/ingresos/nuevo')
const isAddExpensePage  = computed(() => route.path === '/gastos/nuevo')
const isAddReminderPage = computed(() => route.path === '/recordatorios/nuevo')
const isAddPage = computed(() => isAddIncomePage.value || isAddExpensePage.value || isAddReminderPage.value)

/* ===== Histórico ===== */
const isHistoryPage = computed(() => route.path.startsWith('/historico'))

/* ✅ pestaña activa desde la ruta actual */
const historyTab = computed(() => {
  if (route.path.startsWith('/historico/ingresos')) return 'income'
  if (route.path.startsWith('/historico/gastos'))   return 'expense'
  // legacy /historico (evítalo, pero lo soportamos)
  const q = String(route.query.tab || 'income')
  return q === 'expense' ? 'expense' : q === 'both' ? 'both' : 'income'
})

const activeTab = computed(() => {
  if (route.path.startsWith('/ingresos')) return 'ingresos'
  if (route.path.startsWith('/gastos'))   return 'gastos'
  return ''
})

const toastOpen = ref(false)
const toastMsg  = ref('')

async function go(path){
  try{ if(route.path!==path) await router.push(path) }
  catch{ fail() }
}

function emitAccept(){
  window.dispatchEvent(new CustomEvent('bottom-accept'))
}

function notifyUnavailable(){
  toastMsg.value = 'Accede al historial desde el menú lateral.'
  toastOpen.value = true
}

async function goDashboard(){
  try{
    window.dispatchEvent(new CustomEvent('bottom-back'))
    const target = isAddReminderPage.value ? '/recordatorios' : '/dashboard'
    await router.replace(target)
  }catch{}
}

/* 🔹 Por defecto siempre abrir /historico/ingresos (skin blanco) */
async function goHistory(){
  try{
    const target = '/historico/ingresos'   // ✅ forzamos vista nueva
    if (route.path !== target) await router.push(target)
  }catch{
    fail()
  }
}

/* ✅ Tabs del histórico:
   - Siempre navegamos a las vistas nuevas (ingresos/gastos).
   - Para "both" mantenemos compat a /historico (si aún existe). */
async function setHistoryTab(mode){
  try{
    const target =
      mode === 'income' ? '/historico/ingresos' :
      mode === 'expense' ? '/historico/gastos' :
      '/historico' // ambos (sólo si conservas la vista legacy)
    if (route.path !== target || route.fullPath !== target){
      await router.replace(target)
    }
  }catch{
    fail()
  }
}

function fail(){
  toastMsg.value='No se pudo abrir la sección. Intenta de nuevo.'
  toastOpen.value=true
}
</script>

<style scoped>
/* --- Contenedor fijo inferior --- */
.bottom-fixed{
  position:fixed; left:0; right:0; bottom:0; z-index:9999;
  height:calc(var(--bottom-bar-height) + env(safe-area-inset-bottom) + 12px);
  background:var(--app-topbar-bg,#0d3f48);
  pointer-events:none;
}
.bottombar{
  pointer-events:auto;
  height:var(--bottom-bar-height);
  padding:8px 14px calc(8px + env(safe-area-inset-bottom)) 14px;
  --background:transparent;
  display:grid; align-items:center;
}

/* ====== Modo CTA (añadir) ====== */
.nav-cta{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
.cta-btn{
  height:48px; border-radius:12px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding:0 12px;
  background:rgba(255,255,255,.12);
  color:#ffffff; font-weight:600; font-size:12.5px;
  text-transform:uppercase; letter-spacing:.05em;
  transition:background .2s;
  text-align:center;
}
.cta-btn ion-icon{ font-size:19px; }
.cta-btn:hover{ background:rgba(255,255,255,.22); }

/* ====== Modo HISTÓRICO (4 botones) ====== */
.nav-history{
  display:grid;
  grid-template-columns: repeat(4, 1fr);
  gap:10px;
}
.nav-history .cta-btn{
  height:44px;
}
.nav-history .cta-btn.active{
  background:#ffffff;
  color:var(--app-topbar-bg,#0d3f48);
  box-shadow:0 2px 6px rgba(0,0,0,.18);
}

/* ====== Modo normal (ícono arriba, texto abajo) ====== */
.nav{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
  background:rgba(255,255,255,.10);
  border-radius:16px;
  padding:10px;
}
.nav-btn{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:4px;
  padding:10px 8px;
  border-radius:12px;
  background:transparent;
  color:#fff;
  font-size:12px;
  line-height:1.1;
  letter-spacing:.3px;
  text-transform:uppercase;
  white-space:nowrap;
  transition:background .2s, color .2s, box-shadow .2s;
}
.nav-btn ion-icon{ font-size:19px; margin-bottom:2px; }
.nav-btn:hover{ background:rgba(255,255,255,.15); }
.nav-btn.active{
  background:#fff;
  color:var(--app-topbar-bg,#0d3f48);
  box-shadow:0 2px 6px rgba(0,0,0,.18);
}

/* Look CTA en modo normal (si usas .nav--cta) */
.nav--cta{
  background:transparent;
  padding:0;
  gap:10px;
}
.nav--cta .nav-btn{
  height:48px; border-radius:12px;
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding:0 12px;
  background:rgba(255,255,255,.12);
  color:#ffffff; font-weight:600; font-size:12.5px;
  text-transform:uppercase; letter-spacing:.05em;
}
.nav--cta .nav-btn ion-icon{ font-size:19px; margin:0; }
.nav--cta .nav-btn:hover{ background:rgba(255,255,255,.22); }
.nav--cta .nav-btn.active{
  background:#ffffff;
  color:var(--app-topbar-bg,#0d3f48);
  box-shadow:0 2px 6px rgba(0,0,0,.18);
}

/* ====== Dark mode ====== */
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
