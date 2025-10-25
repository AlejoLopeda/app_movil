<template>
  <ion-page class="profile-page">
    <app-top-bar :title="'PERFIL DE USUARIO'" />

    <ion-content class="profile-content" fullscreen>
      <!-- Encabezado -->
      <div class="profile-header">
        <button class="avatar-button" @click="avatarModalOpen = true">
          <img v-if="avatarReady" :src="avatarPreview" alt="Foto de perfil" class="profile-avatar" />
          <div v-else class="avatar-skeleton"></div>
        </button>

        <h2 class="profile-name">{{ user.name || '—' }}</h2>
        <p class="profile-email">{{ user.email || '—' }}</p>

        <!-- Acciones cuando hay un recorte pendiente -->
        <div v-if="pendingFile" class="avatar-pending-actions">
          <ion-button :disabled="isSavingAvatar" class="btn" @click="savePendingAvatar">
            {{ isSavingAvatar ? 'GUARDANDO…' : 'GUARDAR AVATAR' }}
          </ion-button>
          <ion-button class="btn" @click="discardPending">Descartar</ion-button>
        </div>
      </div>

      <!-- Datos de sólo lectura -->
      <div class="profile-info">
        <ion-item lines="none">
          <ion-label>Nombre</ion-label>
          <ion-text>{{ user.name || '—' }}</ion-text>
        </ion-item>
        <ion-item lines="none">
          <ion-label>Correo</ion-label>
          <ion-text>{{ user.email || '—' }}</ion-text>
        </ion-item>
      </div>

      <!-- Formulario extras -->
      <div class="profile-info">
        <ion-item lines="none">
          <ion-label position="stacked">Teléfono</ion-label>
          <ion-input v-model="extras.phone" placeholder="Ej: +57 300 000 0000" inputmode="tel" />
        </ion-item>

        <ion-item lines="none">
          <ion-label position="stacked">País</ion-label>
          <ion-input v-model="extras.country" placeholder="Ej: Colombia" autocapitalize="words" />
        </ion-item>

        <ion-item lines="none">
          <ion-label position="stacked">Fecha de nacimiento</ion-label>
          <ion-input type="date" v-model="extras.birthdate" />
        </ion-item>

        <div class="form-actions">
          <ion-button :disabled="saving" class="btn" @click="saveExtras">
            {{ saving ? 'GUARDANDO…' : 'GUARDAR CAMBIOS' }}
          </ion-button>
        </div>
      </div>

      <!-- Toasts -->
      <ion-toast :is-open="toast.open" :message="toast.msg" :duration="2200" color="success" @didDismiss="toast.open=false" />
      <ion-toast :is-open="toastErr.open" :message="toastErr.msg" :duration="3000" color="danger" @didDismiss="toastErr.open=false" />

      <!-- inputs ocultos -->
      <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileChange" />
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden-file" @change="onFileChange" />
    </ion-content>

    <!-- MODAL Avatar grande -->
    <ion-modal :is-open="avatarModalOpen" @didDismiss="avatarModalOpen=false">
      <div class="avatar-modal">
        <img :src="avatarPreview" class="avatar-large" alt="Avatar grande" />
        <div class="avatar-actions">
          <ion-button :disabled="uploading" class="btn" @click="openEditOptions">
            {{ uploading ? 'SUBIENDO…' : 'EDITAR' }}
          </ion-button>
          <ion-button class="btn" @click="avatarModalOpen=false">Cerrar</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL de recorte (vue-advanced-cropper) -->
    <ion-modal :is-open="cropModalOpen" @didDismiss="closeCropper">
      <div class="cropper-modal">
        <div class="cropbox">
          <Cropper
            ref="cropperRef"
            :src="tempPreview"
            :stencil-component="CircleStencil"
            :image-restriction="'fit-area'"
            :coordinates="initialCoords"
            :class="'vac-cropper'"
          />
        </div>
        <div class="cropper-actions">
          <ion-button class="btn" @click="confirmCrop">Aplicar</ion-button>
          <ion-button class="btn" @click="closeCropper">Cancelar</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Hoja de acciones -->
    <ion-action-sheet
      :is-open="actionOpen"
      header="Seleccionar imagen"
      :buttons="actionButtons"
      @didDismiss="actionOpen=false"
    />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
  IonPage, IonContent, IonItem, IonLabel, IonText, IonInput, IonButton,
  IonToast, IonModal, IonActionSheet
} from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { supabase } from '@/lib/supabaseClient'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
// CSS global de esta lib ya está en main.ts

// -------- Constantes
const defaultImage = 'https://i.pravatar.cc/200?img=64'
const AVATAR_BUCKET = 'avatars'
const MAX_MB = 5

// -------- State
const user = ref({ id: '', name: '', email: '' })
const extras = ref({ phone: '', country: '', birthdate: '', avatar_url: '' })

const saving = ref(false)
const uploading = ref(false)
const isSavingAvatar = ref(false)
const toast = ref({ open: false, msg: '' })
const toastErr = ref({ open: false, msg: '' })

// URL actual resuelta + control de flash
const tempAvatarUrl = ref('')
const avatarReady = ref(false)

// Edición pendiente
const pendingFile = ref(null)
const pendingPreview = ref('')

// Avatar mostrado: pendiente > resuelta > default
const avatarPreview = computed(() =>
  pendingPreview.value || tempAvatarUrl.value || defaultImage
)

const avatarModalOpen = ref(false)
const actionOpen = ref(false)

const fileInput = ref(null)
const cameraInput = ref(null)

/* ===== Recorte con vue-advanced-cropper ===== */
const cropModalOpen = ref(false)
const cropperRef = ref(null)
const tempPreview = ref('')

// centrado inicial (la lib autoajusta, pero dejamos objeto por si quieres forzar)
const initialCoords = ref(null)

function closeCropper(){
  cropModalOpen.value = false
  tempPreview.value = ''
  initialCoords.value = null
}

// Hoja de acciones
const actionButtons = [
  { text: 'Cámara', handler: pickFromCamera },
  { text: 'Galería', handler: pickFromGallery },
  { text: 'Cancelar', role: 'cancel' }
]

onMounted(loadAll)
watch(() => extras.value.avatar_url, resolveAvatarUrl)

// ---------- Carga inicial
async function loadAll(){
  try{
    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user
    if (!authUser) return

    user.value.id = authUser.id
    user.value.email = authUser.email || ''

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authUser.id)
      .single()
    user.value.name = profile?.full_name || ''

    const { data: xtra } = await supabase
      .from('profile_extras')
      .select('phone, country, birthdate, avatar_url')
      .eq('user_id', authUser.id)
      .single()

    if (xtra){
      extras.value = {
        phone: xtra.phone || '',
        country: xtra.country || '',
        birthdate: xtra.birthdate || '',
        avatar_url: xtra.avatar_url || ''
      }
    }
    await resolveAvatarUrl(true)
  }catch(e){
    console.error(e); avatarReady.value = true
    toastErr.value = { open: true, msg: e.message || 'Error cargando perfil' }
  }
}

// Convierte ruta/URL guardada a visible
async function resolveAvatarUrl(isFirstLoad = false){
  const v = (extras.value.avatar_url || '').trim()
  if (pendingFile.value) return
  if (!v){
    tempAvatarUrl.value = ''; avatarReady.value = true; return
  }
  if (/^https?:\/\//i.test(v)){
    tempAvatarUrl.value = v; avatarReady.value = true; return
  }
  try{
    const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(v, 60*60*24*7)
    tempAvatarUrl.value = data?.signedUrl || ''
  }catch(e){
    console.error(e); tempAvatarUrl.value = ''
  }finally{
    if (isFirstLoad) avatarReady.value = true
  }
}

// Guardar extras (no avatar)
async function saveExtras(){
  if (!user.value.id) return
  saving.value = true
  try{
    const payload = {
      user_id: user.value.id,
      phone: (extras.value.phone || '').trim() || null,
      country: (extras.value.country || '').trim() || null,
      birthdate: (extras.value.birthdate || '').slice(0,10) || null,
      avatar_url: (extras.value.avatar_url || '').trim() || null,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('profile_extras').upsert(payload, { onConflict: 'user_id' })
    if (error) throw error
    toast.value = { open: true, msg: 'Perfil actualizado' }
    await resolveAvatarUrl()
  }catch(e){
    console.error(e)
    toastErr.value = { open: true, msg: e.message || 'No se pudo guardar' }
  }finally{
    saving.value = false
  }
}

// --------- Edición de avatar
async function openEditOptions () {
  avatarModalOpen.value = false
  await nextTick()
  actionOpen.value = true
}

async function pickFromCamera(){
  actionOpen.value = false
  await nextTick()
  if (Capacitor.isNativePlatform()){
    try{
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        correctOrientation: true
      })
      if (photo?.dataUrl){ tempPreview.value = photo.dataUrl; cropModalOpen.value = true }
    }catch{}
  }else{
    cameraInput.value?.click()
  }
}

async function pickFromGallery(){
  actionOpen.value = false
  await nextTick()
  if (Capacitor.isNativePlatform()){
    try{
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 85
      })
      if (photo?.dataUrl){ tempPreview.value = photo.dataUrl; cropModalOpen.value = true }
    }catch{}
  }else{
    fileInput.value?.click()
  }
}

async function onFileChange(ev){
  const file = ev.target.files?.[0]
  ev.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')){
    toastErr.value = { open: true, msg: 'Selecciona una imagen válida.' }
    return
  }
  const sizeMB = file.size / (1024*1024)
  if (sizeMB > MAX_MB){
    toastErr.value = { open: true, msg: `La imagen supera ${MAX_MB} MB.` }
    return
  }
  const dataUrl = await fileToDataUrl(file)
  tempPreview.value = dataUrl
  cropModalOpen.value = true
}
function fileToDataUrl(file){
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result)
    fr.onerror = rej
    fr.readAsDataURL(file)
  })
}

// Aplica el recorte circular y deja pendiente
async function confirmCrop(){
  const c = cropperRef.value
  if (!c) return
  const { canvas } = c.getResult({
    size: { width: 512, height: 512 },
    format: 'image/png',
    fillColor: 'transparent'
  })
  if (!canvas){
    toastErr.value = { open:true, msg:'No se pudo generar la imagen' }
    return
  }
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png', 0.92))
  if (!blob){
    toastErr.value = { open:true, msg:'No se pudo generar la imagen' }
    return
  }
  pendingFile.value = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' })
  pendingPreview.value = URL.createObjectURL(blob)
  closeCropper()
  toast.value = { open: true, msg: 'Vista previa lista. Guarda para aplicar.' }
}

function discardPending(){
  if (pendingPreview.value) URL.revokeObjectURL(pendingPreview.value)
  pendingPreview.value = ''
  pendingFile.value = null
  resolveAvatarUrl()
}

async function savePendingAvatar(){
  if (!pendingFile.value || !user.value.id) return
  isSavingAvatar.value = true
  try{
    const file = pendingFile.value
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${user.value.id}/${Date.now()}.${ext}`

    const sizeMB = file.size / (1024*1024)
    if (sizeMB > MAX_MB) throw new Error(`La imagen supera ${MAX_MB} MB.`)

    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw upErr

    extras.value.avatar_url = path
    await saveExtras()
    await resolveAvatarUrl()
    discardPending()
    toast.value = { open: true, msg: 'Avatar guardado' }
  }catch(e){
    console.error(e)
    toastErr.value = { open: true, msg: e.message || 'No se pudo guardar el avatar' }
  }finally{
    isSavingAvatar.value = false
  }
}
</script>

<style scoped>
.profile-content{ --background:#f2f5f7; padding-top: calc(var(--app-topbar-height) + 20px); }
.profile-header{ text-align:center; padding:30px 16px 14px; }

.avatar-button{ position:relative; display:inline-block; padding:0; border:0; background:transparent; }
.profile-avatar{
  display:block; width:120px; height:120px; aspect-ratio:1/1; object-fit:cover; border-radius:50%;
  border:4px solid #0b3a43; background:#fff; box-shadow:0 6px 18px rgba(0,0,0,.1);
}
.avatar-skeleton{
  width:120px; height:120px; border-radius:50%;
  background:linear-gradient(90deg,#e9eef1,#f6f9fb,#e9eef1);
  animation:sk 1.2s infinite; border:4px solid #0b3a43; box-shadow:0 6px 18px rgba(0,0,0,.1);
}
@keyframes sk{0%{background-position:0 0}100%{background-position:300px 0}}

.avatar-pending-actions{ margin-top:10px; display:flex; gap:10px; justify-content:center; }

.profile-name{ margin-top:12px; font-size:20px; font-weight:800; color:#0b3a43; }
.profile-email{ margin-top:4px; color:#4a6168; font-weight:600; }

.profile-info{ background:#fff; border-radius:14px; margin:16px; padding:10px 0; box-shadow:0 10px 30px rgba(16,28,33,.08); }
ion-item{ --background:transparent; --color:#0b3a43; font-weight:700; --inner-padding-end:16px; --padding-start:16px; }

.form-actions{ display:flex; justify-content:flex-end; gap:8px; padding:10px 16px 4px; }
.btn{ --background:#0b3a43; --color:#fff; --border-radius:14px; --box-shadow:0 6px 20px rgba(11,58,67,.25); height:42px; font-weight:800; letter-spacing:.02em; text-transform:uppercase; }

/* ===== Centrar y dimensionar los ion-modal ===== */
:deep(ion-modal){
  --height:auto;
  --max-height:92vh;
  --width:min(92vw, 480px);
  --border-radius:16px;
  --backdrop-opacity:.36;
}
/* Contenedor visual del modal centrado */
:deep(ion-modal::part(content)){
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px;
  box-sizing:border-box;
}

/* Tarjetas internas */
.avatar-modal,
.cropper-modal{
  width:100%;
  max-width:520px;
  margin:0 auto;
  background:#fff;
  border-radius:16px;
  display:grid;
  grid-auto-rows:min-content;
  justify-items:center;  /* centra todo dentro */
  gap:14px;
  padding:16px;
  text-align:center;
}

/* Imagen del modal avatar */
.avatar-large{
  width:min(86vw, 420px);
  height:min(86vw, 420px);
  object-fit:cover;
  border-radius:16px;
  border:6px solid #0b3a43;
  box-shadow:0 12px 30px rgba(0,0,0,.18);
  margin:0 auto;
  display:block;
}
.avatar-actions{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.avatar-actions .btn{ min-width:132px; }

.hidden-file{ display:none; }

/* ===== Modal de recorte ===== */
.cropbox{
  position:relative;
  width:min(90vw, 420px);
  height:min(90vw, 420px);
  border-radius:16px;
  box-shadow:0 12px 30px rgba(0,0,0,.18);
  border:6px solid #0b3a43;
  overflow:hidden;
  margin-inline:auto;   /* centra el marco */
  align-self:center;    /* asegura centrado en grid */
}
.vac-cropper { width:100%; height:100%; }
.vac-cropper :deep(.vue-advanced-cropper__image),
.vac-cropper :deep(.vue-advanced-cropper__foreground),
.vac-cropper :deep(.vue-advanced-cropper__background){
  width:100%; height:100%;
}
.cropper-actions{ display:flex; gap:12px; margin-top:8px; justify-content:center; flex-wrap:wrap; }
</style>