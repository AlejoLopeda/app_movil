// composables/useAvatar.js
import { ref, computed, watchEffect } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera'
import {
  createSignedUrl,
  uploadAvatar,
  getAuthUser,
  updateAvatarUrl, // ✅ persiste en BD la nueva ruta
} from '@/services/profileService'

const AVATAR_BUCKET = 'avatars'
const MAX_MB = 5
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7
const CACHE_GRACE_SECONDS = 60 * 10

// v2: el caché depende de user y path
const cacheKeyFor = (userId, path) => `avatar:v2:${userId}:${path}`

const defaultImage = 'https://i.pravatar.cc/200?img=64'

const preload = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(src)
  img.onerror = reject
  img.src = src
})

async function signIfNeeded(value) {
  const v = (value || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const signed = await createSignedUrl(AVATAR_BUCKET, v, SIGN_TTL_SECONDS)
  return signed || ''
}

function clearUserAvatarCache(uid) {
  try {
    const keys = Object.keys(localStorage)
    for (const k of keys) {
      if (k.startsWith(`avatar:v2:${uid}:`)) localStorage.removeItem(k)
      if (k === `avatar:v1:${uid}`) localStorage.removeItem(k) // legacy
    }
  } catch {}
}

/* =================== NUEVO: pedir permisos la 1ª vez =================== */
const PERM_FLAG = 'avatar.perms.v1'
async function requestRuntimePermissionsIfFirstTime(toastErr) {
  if (!Capacitor.isNativePlatform()) return true
  try {
    const already = localStorage.getItem(PERM_FLAG)
    // Solo la primera vez: pedir ambos permisos juntos
    if (!already) {
      const res = await Camera.requestPermissions({ permissions: ['camera', 'photos'] })
      const cam = res?.camera
      const pho = res?.photos
      const ok = (cam === 'granted' || cam === 'limited') && (pho === 'granted' || pho === 'limited')
      if (!ok) {
        toastErr.value = { open: true, msg: 'Necesitas permitir Cámara y Fotos para cambiar tu avatar.' }
        return false
      }
      localStorage.setItem(PERM_FLAG, '1')
    }
    return true
  } catch (e) {
    console.error(e)
    toastErr.value = { open: true, msg: 'No fue posible solicitar permisos.' }
    return false
  }
}
/* ====================================================================== */

export function useAvatar({ user, extras, toast, toastErr }){
  const uploading = ref(false)
  const isSavingAvatar = ref(false)

  const tempAvatarUrl = ref('')
  const avatarReady = ref(false)

  const pendingFile = ref(null)
  const pendingPreview = ref('')

  const avatarPreview = computed(() => pendingPreview.value || tempAvatarUrl.value || '')

  const avatarModalOpen = ref(false)
  const actionOpen = ref(false)

  const fileInput = ref(null)
  const cameraInput = ref(null)

  // Cropper
  const cropModalOpen = ref(false)
  const cropperRef = ref(null)
  const tempPreview = ref('')
  const initialCoords = ref(null)

  function closeCropper(){
    cropModalOpen.value = false
    tempPreview.value = ''
    initialCoords.value = null
  }

  const actionButtons = [
    { text: 'Cámara', handler: pickFromCamera },
    { text: 'Galería', handler: pickFromGallery },
    { text: 'Cancelar', role: 'cancel' }
  ]

  /* ====== Resolver URL visible ====== */
  async function resolveAvatarUrl(isFirstCall = false){
    if (pendingFile.value) return

    const raw = (extras.value.avatar_url || '').trim()
    const authUser = await getAuthUser()
    const uid = authUser?.id

    if (!raw){
      tempAvatarUrl.value = ''
      avatarReady.value = true
      return
    }

    if (/^https?:\/\//i.test(raw)){
      try { await preload(raw) } catch {}
      tempAvatarUrl.value = raw
      avatarReady.value = true
      return
    }

    if (uid){
      const key = cacheKeyFor(uid, raw)
      const cachedRaw = localStorage.getItem(key)
      const now = Math.floor(Date.now()/1000)

      if (cachedRaw){
        try{
          const cached = JSON.parse(cachedRaw)
          if (cached?.path === raw && cached?.signedUrl && cached?.exp && (cached.exp - now) > CACHE_GRACE_SECONDS){
            try { await preload(cached.signedUrl) } catch {}
            tempAvatarUrl.value = cached.signedUrl
            avatarReady.value = true
            return
          }
        }catch{}
      }

      try{
        let signed = await signIfNeeded(raw)
        if (signed){
          signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
          try { await preload(signed) } catch {}
          tempAvatarUrl.value = signed
          avatarReady.value = true
          localStorage.setItem(key, JSON.stringify({
            path: raw,
            signedUrl: signed,
            exp: Math.floor(Date.now()/1000) + SIGN_TTL_SECONDS
          }))
        }
      }catch(e){
        console.error(e)
        if (!tempAvatarUrl.value) avatarReady.value = true
      }
    }else{
      try{
        let signed = await signIfNeeded(raw)
        if (signed){
          signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
          try { await preload(signed) } catch {}
          tempAvatarUrl.value = signed
        } else {
          tempAvatarUrl.value = ''
        }
      }catch{ tempAvatarUrl.value = '' }
      avatarReady.value = true
    }

    if (isFirstCall && !avatarReady.value) avatarReady.value = true
  }

  /* ======== Permisos (Cámara / Fotos) ======== */
  async function ensurePermission(kind /* 'camera' | 'photos' */){
    try{
      const current = await Camera.checkPermissions()
      let status = current?.[kind] || 'prompt'
      if (status !== 'granted' && status !== 'limited'){
        const req = await Camera.requestPermissions({ permissions: [kind] })
        status = req?.[kind] || 'denied'
      }
      if (status === 'granted' || status === 'limited') return true
      toastErr.value = { open: true, msg: `Permiso de ${kind === 'camera' ? 'cámara' : 'fotos'} denegado.` }
      return false
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: 'No fue posible solicitar permisos.' }
      return false
    }
  }

  /* ===== Edición de avatar ===== */
  async function openEditOptions () {
    // 🔄 NUEVO: asegura pedir permisos la 1ª vez que abre "Editar"
    const ok = await requestRuntimePermissionsIfFirstTime(toastErr)
    if (!ok) return

    avatarModalOpen.value = false
    await Promise.resolve()
    actionOpen.value = true
  }

  async function pickFromCamera(){
    actionOpen.value = false
    await Promise.resolve()
    if (Capacitor.isNativePlatform()){
      const ok = await ensurePermission('camera')
      if (!ok) return
      try{
        const photo = await Camera.getPhoto({
          source: CameraSource.Camera,
          resultType: CameraResultType.DataUrl, // mantenemos DataUrl para fluir al crop
          quality: 85,
          correctOrientation: true,
          width: 1024, // 🔽 reduce tamaño de captura
        })
        if (photo?.dataUrl){ tempPreview.value = photo.dataUrl; cropModalOpen.value = true }
      }catch(e){
        if (e?.message && e.message !== 'User cancelled photos app') {
          toastErr.value = { open: true, msg: 'No se pudo abrir la cámara.' }
        }
      }
    }else{
      cameraInput.value?.click()
    }
  }

  async function pickFromGallery(){
    actionOpen.value = false
    await Promise.resolve()
    if (Capacitor.isNativePlatform()){
      const ok = await ensurePermission('photos')
      if (!ok) return
      try{
        const photo = await Camera.getPhoto({
          source: CameraSource.Photos,
          resultType: CameraResultType.DataUrl,
          quality: 85,
          width: 1024, // 🔽 reduce tamaño de carga
        })
        if (photo?.dataUrl){ tempPreview.value = photo.dataUrl; cropModalOpen.value = true }
      }catch(e){
        if (e?.message && e.message !== 'User cancelled photos app') {
          toastErr.value = { open: true, msg: 'No se pudo abrir la galería.' }
        }
      }
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

    // ⛳️ CAMBIO: NO bloqueamos por tamaño aquí (el recorte lo volverá liviano).
    // const sizeMB = file.size / (1024*1024)
    // if (sizeMB > MAX_MB){
    //   toastErr.value = { open: true, msg: `La imagen supera ${MAX_MB} MB.` }
    //   return
    // }

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
    resolveAvatarUrl(true)
  }

  async function savePendingAvatar(){
    if (!pendingFile.value || !user.value.id) return
    isSavingAvatar.value = true
    try{
      const file = pendingFile.value
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${user.value.id}/${Date.now()}.${ext}`

      // ✅ Validación de tamaño solo en el archivo FINAL (recortado)
      const sizeMB = file.size / (1024*1024)
      if (sizeMB > MAX_MB) throw new Error(`La imagen final supera ${MAX_MB} MB.`)

      // 1) subir archivo
      await uploadAvatar(AVATAR_BUCKET, path, file)

      // 2) persistir en BD
      await updateAvatarUrl(user.value.id, path)

      // 3) actualizar estado local y limpiar caché antiguo del usuario
      extras.value.avatar_url = path
      clearUserAvatarCache(user.value.id)

      // 4) firmar y usar la nueva URL
      let signed = await signIfNeeded(path)
      if (signed){
        signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
        try { await preload(signed) } catch {}
        tempAvatarUrl.value = signed
        const now = Math.floor(Date.now()/1000)
        const key = cacheKeyFor(user.value.id, path)
        localStorage.setItem(key, JSON.stringify({
          path,
          signedUrl: signed,
          exp: now + SIGN_TTL_SECONDS
        }))

        /* 5) 🔔 NOTIFICAR A TODA LA APP (TopBar y otras vistas) */
        window.dispatchEvent(new CustomEvent('avatar-updated', {
          detail: { userId: user.value.id, path, signedUrl: signed }
        }))
      }

      discardPending()
      toast.value = { open: true, msg: 'Avatar guardado' }
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: e.message || 'No se pudo guardar el avatar' }
    }finally{
      isSavingAvatar.value = false
    }
  }

  watchEffect(async () => {
    await resolveAvatarUrl(true)
  })

  return {
    defaultImage, uploading, isSavingAvatar,
    avatarReady, avatarPreview, avatarModalOpen,
    actionOpen, actionButtons,
    cropModalOpen, cropperRef, tempPreview, initialCoords,
    fileInput, cameraInput,
    openEditOptions, pickFromCamera, pickFromGallery, onFileChange,
    closeCropper, confirmCrop, discardPending, savePendingAvatar,
    pendingFile,
  }
}
