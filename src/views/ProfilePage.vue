<template>
  <ion-page class="profile-page">
    <app-top-bar :title="'PERFIL DE USUARIO'" />

    <ion-content class="profile-content" fullscreen>
      <!-- Encabezado -->
      <div class="profile-header">
        <button class="avatar-button" @click="avatarModalOpen = true">
          <img :src="avatarPreview" alt="Foto de perfil" class="profile-avatar" />
        </button>

        <h2 class="profile-name">{{ user.name || '—' }}</h2>
        <p class="profile-email">{{ user.email || '—' }}</p>
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
      <ion-toast :is-open="toast.open" :message="toast.msg" :duration="2200" color="success"
                 @didDismiss="toast.open=false" />
      <ion-toast :is-open="toastErr.open" :message="toastErr.msg" :duration="3000" color="danger"
                 @didDismiss="toastErr.open=false" />

      <!-- input oculto para fallback web -->
      <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileChange" />
      <input ref="cameraInput" type="file" accept="image/*" capture="environment"
             class="hidden-file" @change="onFileChange" />
    </ion-content>

    <!-- MODAL Avatar grande -->
    <ion-modal :is-open="avatarModalOpen" @didDismiss="avatarModalOpen=false">
      <div class="avatar-modal">
        <img :src="avatarPreview" class="avatar-large" alt="Avatar grande" />
        <div class="avatar-actions">
          <ion-button :disabled="uploading" class="btn" @click="openEditOptions">
            {{ uploading ? 'SUBIENDO…' : 'EDITAR' }}
          </ion-button>
          <ion-button fill="clear" @click="avatarModalOpen=false">Cerrar</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Hoja de acciones: elegir fuente -->
    <ion-action-sheet
      :is-open="actionOpen"
      header="Seleccionar imagen"
      :buttons="actionButtons"
      @didDismiss="actionOpen=false"
    />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import {
  IonPage, IonContent, IonItem, IonLabel, IonText, IonInput, IonButton,
  IonToast, IonModal, IonActionSheet
} from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import { supabase } from '@/lib/supabaseClient'

/* Capacitor Camera (para APK) */
import { Capacitor } from '@capacitor/core'
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera'

const defaultImage = 'https://i.pravatar.cc/200?img=64'
const AVATAR_BUCKET = 'avatars'
const MAX_MB = 5

/* Base profile */
const user = ref({ id: '', name: '', email: '' })

/* Extras: avatar_url ahora guarda SOLO la RUTA "uid/archivo.jpg" */
const extras = ref({ phone: '', country: '', birthdate: '', avatar_url: '' })

/* UI */
const saving = ref(false)
const uploading = ref(false)
const toast = ref({ open: false, msg: '' })
const toastErr = ref({ open: false, msg: '' })

/* URL resuelta para mostrar (signed o pública).  */
/* Prioriza esta si existe; si no, usa defaultImage */
const tempAvatarUrl = ref('') // signed URL o public URL lista para <img>

/* Avatar mostrado en la UI */
const avatarPreview = computed(() => tempAvatarUrl.value || defaultImage)

/* Modal y acciones */
const avatarModalOpen = ref(false)
const actionOpen = ref(false)

/* Inputs ocultos (fallback web) */
const fileInput = ref(null)
const cameraInput = ref(null)

/* Botones hoja de acciones */
const actionButtons = [
  { text: 'Cámara', handler: pickFromCamera },
  { text: 'Galería', handler: pickFromGallery },
  { text: 'Cancelar', role: 'cancel' }
]

onMounted(loadAll)

/* Evalúa cambios en la ruta guardada y resuelve una URL visible */
watch(() => extras.value.avatar_url, resolveAvatarUrl)

/* Carga datos */
async function loadAll(){
  try{
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr) throw authErr
    const authUser = authData?.user
    if (!authUser) return

    user.value.id = authUser.id
    user.value.email = authUser.email || ''

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', authUser.id)
      .single()
    if (profErr && profErr.code !== 'PGRST116') throw profErr
    user.value.name = profile?.full_name || ''

    const { data: xtra, error: xErr } = await supabase
      .from('profile_extras')
      .select('phone, country, birthdate, avatar_url')
      .eq('user_id', authUser.id)
      .single()
    if (xErr && xErr.code !== 'PGRST116') throw xErr

    if (xtra){
      extras.value = {
        phone: xtra.phone || '',
        country: xtra.country || '',
        birthdate: xtra.birthdate || '',
        avatar_url: xtra.avatar_url || ''  // ⚠️ puede ser ruta o estar vacío
      }
    }
    await resolveAvatarUrl()
  }catch(e){
    console.error(e)
    toastErr.value = { open: true, msg: e.message || 'Error cargando perfil' }
  }
}

/* Convierte lo guardado en BD (ruta o URL) a una URL mostrable */
async function resolveAvatarUrl(){
  const v = (extras.value.avatar_url || '').trim()
  tempAvatarUrl.value = ''

  if (!v){
    return // quedará defaultImage
  }
  // Si ya viene una URL completa (por si migraste desde bucket público)
  if (/^https?:\/\//i.test(v)){
    tempAvatarUrl.value = v
    return
  }
  // Es una RUTA en el bucket privado -> crear signed URL
  try{
    const { data, error } = await supabase
      .storage.from(AVATAR_BUCKET)
      .createSignedUrl(v, 60 * 60 * 24 * 7) // 7 días
    if (error) throw error
    tempAvatarUrl.value = data.signedUrl
  }catch(e){
    console.error(e)
    // si falla, dejamos default
  }
}

/* Guardar extras (sin subir avatar) */
async function saveExtras(){
  if (!user.value.id) return
  saving.value = true
  try{
    const payload = {
      user_id: user.value.id,
      phone: (extras.value.phone || '').trim() || null,
      country: (extras.value.country || '').trim() || null,
      birthdate: (extras.value.birthdate || '').slice(0,10) || null,
      // avatar_url se guarda tal cual (ruta o vacío)
      avatar_url: (extras.value.avatar_url || '').trim() || null,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('profile_extras').upsert(payload, { onConflict: 'user_id' })
    if (error) throw error
    toast.value = { open: true, msg: 'Perfil actualizado' }
    await resolveAvatarUrl() // por si cambiaste ruta manualmente
  }catch(e){
    console.error(e)
    toastErr.value = { open: true, msg: e.message || 'No se pudo guardar' }
  }finally{
    saving.value = false
  }
}

/* Abrir hoja de acciones */
function openEditOptions(){
  actionOpen.value = true
}

/* ===== Selección de imagen ===== */
async function pickFromCamera(){
  actionOpen.value = false
  if (Capacitor.isNativePlatform()){
    try{
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        correctOrientation: true
      })
      if (photo?.dataUrl) await uploadDataUrl(photo.dataUrl)
    }catch(e){ /* cancel */ }
  }else{
    cameraInput.value?.click() // fallback web
  }
}

async function pickFromGallery(){
  actionOpen.value = false
  if (Capacitor.isNativePlatform()){
    try{
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 85
      })
      if (photo?.dataUrl) await uploadDataUrl(photo.dataUrl)
    }catch(e){ /* cancel */ }
  }else{
    fileInput.value?.click() // fallback web
  }
}

/* Fallback web: input file */
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
  await uploadFile(file)
}

/* ===== Subida a Supabase Storage ===== */
async function uploadDataUrl(dataUrl){
  // convertir dataURL a Blob
  const resp = await fetch(dataUrl)
  const blob = await resp.blob()
  const file = new File([blob], `camera_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
  await uploadFile(file)
}

/* ⚠️ Ajustado: guardamos RUTA en BD y resolvemos signed URL para mostrar */
async function uploadFile(file){
  if (!user.value.id) return
  uploading.value = true
  try{
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.value.id}/${Date.now()}.${ext}`

    const sizeMB = file.size / (1024*1024)
    if (sizeMB > MAX_MB) throw new Error(`La imagen supera ${MAX_MB} MB.`)

    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw upErr

    // Guarda en BD SOLO la ruta
    extras.value.avatar_url = path
    await saveExtras()

    // Genera signed URL para previsualizar al instante
    const { data: signed, error: sErr } = await supabase
      .storage.from(AVATAR_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (sErr) throw sErr

    tempAvatarUrl.value = signed.signedUrl
    toast.value = { open: true, msg: 'Avatar actualizado' }
  }catch(e){
    console.error(e)
    toastErr.value = { open: true, msg: e.message || 'No se pudo subir el avatar' }
  }finally{
    uploading.value = false
  }
}
</script>


<style scoped>
.profile-content{
  --background:#f2f5f7;
  padding-top: calc(var(--app-topbar-height) + 20px);
}

.profile-header{ text-align:center; padding:30px 16px 20px; }

.avatar-button{
  position: relative;
  display: inline-block;
  padding: 0; border: 0; background: transparent;
}

.profile-avatar{
  width: 120px; height: 120px;
  border-radius: 50%; object-fit: cover;
  border: 4px solid #0b3a43; background: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,.1);
}

.profile-name{ margin-top:12px; font-size:20px; font-weight:800; color:#0b3a43; }
.profile-email{ margin-top:4px; color:#4a6168; font-weight:600; }

.profile-info{
  background:#fff; border-radius:14px; margin:16px; padding:10px 0;
  box-shadow:0 10px 30px rgba(16,28,33,.08);
}

ion-item{
  --background:transparent; --color:#0b3a43; font-weight:700;
  --inner-padding-end:16px; --padding-start:16px;
}

.form-actions{ display:flex; justify-content:flex-end; gap:8px; padding:10px 16px 4px; }
.btn{
  --background:#0b3a43; --color:#fff; --border-radius:14px;
  --box-shadow:0 6px 20px rgba(11,58,67,.25);
  height:42px; font-weight:800; letter-spacing:.02em; text-transform:uppercase;
}

/* ===== Modal de avatar ===== */
.avatar-modal{
  background:#fff; padding:16px; border-radius:16px;
  display:flex; flex-direction:column; align-items:center; gap:14px;
}
.avatar-large{
  width:min(86vw, 420px);
  height:min(86vw, 420px);
  object-fit:cover; border-radius:16px; border: 6px solid #0b3a43;
  box-shadow:0 12px 30px rgba(0,0,0,.18);
}
.avatar-actions{ display:flex; gap:10px; }
.hidden-file{ display:none; }

/* --- Fijar el contenedor del avatar --- */
.avatar-button{
  display:inline-grid;
  place-items:center;
  padding:0;
  margin:0;
  border:0;
  background:transparent;
  line-height:0;               /* evita que el botón “aplane” el contenido */
}

/* --- Imagen: bloquear cualquier regla global que limite altura --- */
.profile-avatar{
  display:block !important;
  width: 120px !important;
  height: 120px !important;
  aspect-ratio: 1 / 1 !important;
  object-fit: cover !important;
  border-radius: 50% !important;
  border: 4px solid #0b3a43 !important;
  background:#fff !important;
  box-shadow: 0 6px 18px rgba(0,0,0,.1) !important;
  max-width: none !important;
  max-height: none !important;
}

/* Por si hay algún reset que fuerza imgs dentro de botones */
.avatar-button img{
  max-width:none !important;
  max-height:none !important;
}

</style>

