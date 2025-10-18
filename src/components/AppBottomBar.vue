<template>
  <div v-show="isMainRoute" class="bottom-fixed">
    <ion-toolbar class="bottombar">
      <!-- modo especial: Añadir Ingreso o Añadir Gasto -->
      <div v-if="isAddPage" class="nav-cta">
        <button class="cta-btn" @click="goDashboard">
          <ion-icon :icon="chevronBackOutline" />
        </button>
        <button class="cta-btn" @click="emitAccept">
          <ion-icon :icon="checkmarkOutline" />
          <span>ACEPTAR</span>
        </button>
      </div>

      <!-- modo normal: 3 pestañas (ahora con estilo de botones CTA) -->
      <nav v-else class="nav nav--cta">
        <button class="nav-btn" :class="{ active: activeTab==='ingresos' }" @click="go('/ingresos')">
          <ion-icon :icon="cashOutline" />
          <span>INGRESO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='gastos' }" @click="go('/gastos')">
          <ion-icon :icon="cardOutline" />
          <span>GASTO</span>
        </button>
        <button class="nav-btn" :class="{ active: activeTab==='historico' }" @click="go('/historico')">
          <ion-icon :icon="timeOutline" />
          <span>HISTORIAL</span>
        </button>
      </nav>
    </ion-toolbar>

    <ion-toast :is-open="toastOpen" :message="toastMsg" :duration="2200" color="danger" @didDismiss="toastOpen=false" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonToolbar, IonIcon, IonToast } from '@ionic/vue'
import {
  cashOutline, cardOutline, timeOutline,
  chevronBackOutline, checkmarkOutline
} from 'ionicons/icons'

const MAIN_ROUTES = ['/ingresos','/gastos','/historico','/dashboard','/monto','/recordatorios']

const route = useRoute()
const router = useRouter()

const isMainRoute = computed(() => MAIN_ROUTES.some(p => route.path.startsWith(p)))
const isAddIncomePage   = computed(() => route.path === '/ingresos/nuevo')
const isAddExpensePage  = computed(() => route.path === '/gastos/nuevo')
const isAddReminderPage = computed(() => route.path === '/recordatorios/nuevo')
const isAddPage = computed(() => isAddIncomePage.value || isAddExpensePage.value || isAddReminderPage.value)

const activeTab = computed(() => {
  if (route.path.startsWith('/ingresos')) return 'ingresos'
  if (route.path.startsWith('/gastos'))   return 'gastos'
  if (route.path.startsWith('/historico'))return 'historico'
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

async function goDashboard(){
  try{
    window.dispatchEvent(new CustomEvent('bottom-back'))
    const target = isAddReminderPage.value ? '/recordatorios' : '/dashboard'
    await router.replace(target)
  }catch{}
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
  /* más alto para que no “corte” nada en móvil */
  height:calc(var(--bottom-bar-height) + env(safe-area-inset-bottom) + 12px);
  background:var(--app-topbar-bg,#0d3f48);
  pointer-events:none;
}
.bottombar{
  pointer-events:auto;
  height:var(--bottom-bar-height);
  /* + aire lateral y bottom con safe-area */
  padding:8px 14px calc(8px + env(safe-area-inset-bottom)) 14px;
  --background:transparent;
  display:grid; align-items:center;
}

/* ====== Modo CTA (pantallas de añadir) ====== */
.nav-cta{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
.cta-btn{
  height:48px; border-radius:12px;
  /* ⬇️ Flex para centrar icono + texto como los otros botones */
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding:0 12px;
  background:rgba(255,255,255,.12);
  color:#ffffff; font-weight:600; font-size:12.5px; /* ↓ un poco */
  text-transform:uppercase; letter-spacing:.05em;
  transition:background .2s;
  text-align:center;
}
.cta-btn ion-icon{ font-size:19px; } /* ↓ un poco */
.cta-btn:hover{ background:rgba(255,255,255,.22); }

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
  font-size:12px;            /* ↓ apenas para que no se coma “HISTORIAL” */
  line-height:1.1;
  letter-spacing:.3px;
  text-transform:uppercase;
  white-space:nowrap;
  transition:background .2s, color .2s, box-shadow .2s;
}
.nav-btn ion-icon{
  font-size:19px;            /* ↓ un poco */
  margin-bottom:2px;
}
.nav-btn:hover{
  background:rgba(255,255,255,.15);
}
.nav-btn.active{
  background:#fff;
  color:var(--app-topbar-bg,#0d3f48);
  box-shadow:0 2px 6px rgba(0,0,0,.18);
}

/* ====== Look CTA opcional en modo normal (si usas .nav--cta) ====== */
.nav--cta{
  background:transparent;
  padding:0;
  gap:10px;
}
.nav--cta .nav-btn{
  height:48px; border-radius:12px;
  /* ⬇️ Igual que .cta-btn para centrar icono + texto */
  display:flex; align-items:center; justify-content:center; gap:6px;
  padding:0 12px;
  background:rgba(255,255,255,.12);
  color:#ffffff; font-weight:600; font-size:12.5px; /* ↓ igual que CTA */
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






