// src/composables/useAvatar.js
import { ref, computed, watchEffect } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera'
import {
  createSignedUrl,
  uploadAvatar,
  updateAvatarUrl,
} from '@/services/profileService'
import { useAuthUser } from '@/composables/useAuthUser'

const AVATAR_BUCKET = 'avatars'
const MAX_MB = 5
const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7
const CACHE_GRACE_SECONDS = 60 * 10

// cache en memoria + disco
const memCache = new Map()
const cacheKeyFor = (userId, path) => `avatar:v2:${userId}:${path}`

export const defaultImage = 'https://i.pravatar.cc/200?img=64'

// Helpers de plataforma
const isAndroid = () => Capacitor.getPlatform() === 'android'

function warmup(src) {
  try {
    const img = new Image()
    img.decoding = 'async'
    img.loading = 'eager'
    img.src = src
  } catch {}
}

async function signIfNeeded(value) {
  const v = (value || '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  const signed = await createSignedUrl(AVATAR_BUCKET, v, SIGN_TTL_SECONDS)
  return signed || ''
}

function clearUserAvatarCache(uid) {
  try {
    for (const k of memCache.keys()) if (k.startsWith(`avatar:v2:${uid}:`)) memCache.delete(k)
    const keys = Object.keys(localStorage)
    for (const k of keys) {
      if (k.startsWith(`avatar:v2:${uid}:`)) localStorage.removeItem(k)
      if (k === `avatar:v1:${uid}`) localStorage.removeItem(k) // legacy
    }
  } catch {}
}

/* ======= PERMISOS: versión separada cámara / galería ======= */

// 👇 Si el permiso quedó “bloqueado”, ofrece abrir Ajustes
async function openSettingsIfBlocked(kind, toastErr) {
  if (!isAndroid()) return
  toastErr.value = {
    open: true,
    msg: `Necesitas habilitar el permiso de ${kind === 'camera' ? 'Cámara' : 'Fotos'} en Ajustes.`,
  }
  try { await App.openSettings() } catch {}
}

// 👇 Maneja permiso individual según tipo: 'camera' o 'photos'
async function ensurePermission(kind, toastErr) {
  try {
    const current = await Camera.checkPermissions()
    let status = current?.[kind] || 'prompt'

    if (status !== 'granted' && status !== 'limited') {
      const req = await Camera.requestPermissions({ permissions: [kind] })
      status = req?.[kind] || 'denied'
    }

    if (status === 'granted' || status === 'limited') return true

    // Si sigue denegado (caso Android con “no volver a preguntar”)
    await openSettingsIfBlocked(kind, toastErr)
    return false
  } catch (e) {
    console.error(e)
    toastErr.value = { open: true, msg: 'No fue posible solicitar permisos.' }
    return false
  }
}

export function useAvatar({ user, extras, toast, toastErr }) {
  const { user: authUser } = useAuthUser()

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

  function closeCropper() {
    cropModalOpen.value = false
    tempPreview.value = ''
    initialCoords.value = null
  }

  const actionButtons = [
    { text: 'Cámara', handler: pickFromCamera },
    { text: 'Galería', handler: pickFromGallery },
    { text: 'Cancelar', role: 'cancel' },
  ]

  /* ====== Resolver URL (rápido y sin bloquear) ====== */
  let resolveToken = 0

  async function resolveAvatarUrl() {
    if (pendingFile.value) return
    const myToken = ++resolveToken

    try {
      const raw = (extras.value.avatar_url || '').trim()
      const uid = authUser.value?.id || ''

      if (!raw) {
        tempAvatarUrl.value = ''
        avatarReady.value = true
        return
      }

      if (/^https?:\/\//i.test(raw)) {
        tempAvatarUrl.value = raw
        avatarReady.value = true
        warmup(raw)
        return
      }

      if (uid) {
        const k = cacheKeyFor(uid, raw)
        const now = Math.floor(Date.now() / 1000)

        const mem = memCache.get(k)
        if (mem && mem.exp - now > CACHE_GRACE_SECONDS) {
          tempAvatarUrl.value = mem.signedUrl
          avatarReady.value = true
          warmup(mem.signedUrl)
          return
        }

        const cachedRaw = localStorage.getItem(k)
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw)
            if (cached?.signedUrl && cached?.exp && cached.exp - now > CACHE_GRACE_SECONDS) {
              tempAvatarUrl.value = cached.signedUrl
              avatarReady.value = true
              memCache.set(k, { signedUrl: cached.signedUrl, exp: cached.exp })
              warmup(cached.signedUrl)
              return
            }
          } catch {}
        }

        let signed = await signIfNeeded(raw)
        if (myToken !== resolveToken) return
        if (signed) {
          signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
          tempAvatarUrl.value = signed
          avatarReady.value = true
          const exp = Math.floor(Date.now() / 1000) + SIGN_TTL_SECONDS
          memCache.set(k, { signedUrl: signed, exp })
          localStorage.setItem(k, JSON.stringify({ path: raw, signedUrl: signed, exp }))
          warmup(signed)
        } else {
          tempAvatarUrl.value = ''
          avatarReady.value = true
        }
        return
      }

      let signed = await signIfNeeded(raw)
      if (myToken !== resolveToken) return
      if (signed) {
        signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
        tempAvatarUrl.value = signed
        warmup(signed)
      } else {
        tempAvatarUrl.value = ''
      }
      avatarReady.value = true
    } catch (e) {
      console.error(e)
      if (!avatarReady.value) avatarReady.value = true
    }
  }

  /* ===== Edición de avatar ===== */
  async function openEditOptions() {
    avatarModalOpen.value = false
    await Promise.resolve()
    actionOpen.value = true
  }

  async function pickFromCamera() {
    actionOpen.value = false
    await Promise.resolve()
    if (Capacitor.isNativePlatform()) {
      const ok = await ensurePermission('camera', toastErr) // ✅ solo cámara
      if (!ok) return
      try {
        const photo = await Camera.getPhoto({
          source: CameraSource.Camera,
          resultType: CameraResultType.DataUrl,
          quality: 85,
          correctOrientation: true,
          width: 1024,
        })
        if (photo?.dataUrl) {
          tempPreview.value = photo.dataUrl
          cropModalOpen.value = true
        }
      } catch (e) {
        if (e?.message && e.message !== 'User cancelled photos app') {
          toastErr.value = { open: true, msg: 'No se pudo abrir la cámara.' }
        }
      }
    } else {
      cameraInput.value?.click()
    }
  }

  async function pickFromGallery() {
    actionOpen.value = false
    await Promise.resolve()
    if (Capacitor.isNativePlatform()) {
      const ok = await ensurePermission('photos', toastErr) // ✅ solo galería
      if (!ok) return
      try {
        const photo = await Camera.getPhoto({
          source: CameraSource.Photos,
          resultType: CameraResultType.DataUrl,
          quality: 85,
          width: 1024,
        })
        if (photo?.dataUrl) {
          tempPreview.value = photo.dataUrl
          cropModalOpen.value = true
        }
      } catch (e) {
        if (e?.message && e.message !== 'User cancelled photos app') {
          toastErr.value = { open: true, msg: 'No se pudo abrir la galería.' }
        }
      }
    } else {
      fileInput.value?.click()
    }
  }

  async function onFileChange(ev) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastErr.value = { open: true, msg: 'Selecciona una imagen válida.' }
      return
    }
    const dataUrl = await fileToDataUrl(file)
    tempPreview.value = dataUrl
    cropModalOpen.value = true
  }
  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result)
      fr.onerror = rej
      fr.readAsDataURL(file)
    })
  }

  async function confirmCrop() {
    const c = cropperRef.value
    if (!c) return
    const { canvas } = c.getResult({
      size: { width: 512, height: 512 },
      format: 'image/png',
      fillColor: 'transparent',
    })
    if (!canvas) {
      toastErr.value = { open: true, msg: 'No se pudo generar la imagen' }
      return
    }
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png', 0.92))
    if (!blob) {
      toastErr.value = { open: true, msg: 'No se pudo generar la imagen' }
      return
    }
    pendingFile.value = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' })
    pendingPreview.value = URL.createObjectURL(blob)
    closeCropper()
    toast.value = { open: true, msg: 'Vista previa lista. Guarda para aplicar.' }
  }

  function discardPending() {
    if (pendingPreview.value) URL.revokeObjectURL(pendingPreview.value)
    pendingPreview.value = ''
    pendingFile.value = null
  }

  async function savePendingAvatar() {
    const uid = authUser.value?.id || ''
    if (!pendingFile.value || !uid) return
    isSavingAvatar.value = true
    try {
      const file = pendingFile.value
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${uid}/${Date.now()}.${ext}`

      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_MB) throw new Error(`La imagen final supera ${MAX_MB} MB.`)

      await uploadAvatar(AVATAR_BUCKET, path, file)
      await updateAvatarUrl(uid, path)

      clearUserAvatarCache(uid)

      let signed = await signIfNeeded(path)
      if (signed) {
        signed = `${signed}${signed.includes('?') ? '&' : '?'}t=${Date.now()}`
        tempAvatarUrl.value = signed
        const exp = Math.floor(Date.now() / 1000) + SIGN_TTL_SECONDS
        const k = cacheKeyFor(uid, path)
        memCache.set(k, { signedUrl: signed, exp })
        localStorage.setItem(k, JSON.stringify({ path, signedUrl: signed, exp }))

        if (extras?.value) extras.value.avatar_url = path

        window.dispatchEvent(
          new CustomEvent('avatar-updated', {
            detail: { userId: uid, path, signedUrl: signed },
          }),
        )

        warmup(signed)
      } else {
        tempAvatarUrl.value = ''
      }

      discardPending()
      toast.value = { open: true, msg: 'Avatar guardado' }
    } catch (e) {
      console.error(e)
      toastErr.value = { open: true, msg: e?.message || 'No se pudo guardar el avatar' }
    } finally {
      isSavingAvatar.value = false
    }
  }

  // Reaccionar a cambios (uid o avatar_url)
  watchEffect(() => {
    resolveAvatarUrl()
  })

  return {
    defaultImage,
    uploading,
    isSavingAvatar,
    avatarReady,
    avatarPreview,
    avatarModalOpen,
    actionOpen,
    actionButtons,
    cropModalOpen,
    cropperRef,
    tempPreview,
    initialCoords,
    fileInput,
    cameraInput,
    openEditOptions,
    pickFromCamera,
    pickFromGallery,
    onFileChange,
    closeCropper,
    confirmCrop,
    discardPending,
    savePendingAvatar,
    pendingFile,
  }
}