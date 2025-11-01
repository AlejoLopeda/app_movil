import { ref, computed, watch } from 'vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { formatDate, normalizeDateStr } from '@/lib/date'
import {
  getAuthUser,
  getProfileName,
  getProfileExtras,
  upsertProfileExtras,
  reauthWithPassword,
  updatePassword,
  refreshSession,
  signOut,
} from '@/services/profileService'

export function useProfile(){
  /* ====== State ====== */
  const user   = ref({ id: '', name: '', email: '' })
  const extras = ref({ phone: '', country: '', birthdate: '', avatar_url: '' })

  const editExtras = ref(false)
  const draft = ref({ phone: '', country: '', birthdate: '' })

  /* ===== Password (Seguridad) ===== */
  const editPwd = ref(false)
  const pwdVisible = ref(false)
  const fakePwd = '************'
  const pwdForm = ref({ current: '', new: '', confirm: '' })
  const showCurr = ref(false)
  const showNew  = ref(false)
  const showConf = ref(false)
  const savingPwd = ref(false)
  const pwdMsg = ref({ text: 'Debe tener ≥8, 1 mayúscula y 1 carácter especial.', color: 'muted' })

  /* ===== Varios ===== */
  const saving = ref(false)
  const toast = ref({ open: false, msg: '' })
  const toastErr = ref({ open: false, msg: '' })

  /* ===== Helpers ===== */
  function validatePassword(p){
    const long = p?.length >= 8
    const upper = /[A-Z]/.test(p || '')
    const special = /[^A-Za-z0-9]/.test(p || '')
    return { ok: long && upper && special }
  }

  const hasBirthdate = computed(() => !!normalizeDateStr(extras.value.birthdate))

  function hasExtrasChanges(){
    const phoneChanged   = (draft.value.phone ?? '').trim()   !== (extras.value.phone ?? '')
    const countryChanged = (draft.value.country ?? '').trim() !== (extras.value.country ?? '')
    // birthdate solo cuenta si antes no había y ahora sí
    const birthChanged   = !hasBirthdate.value && !!(draft.value.birthdate || '').trim()
    return phoneChanged || countryChanged || birthChanged
  }

  /* ========= GUARDAR (Bottom bar) ========= */
  const canSave = computed(() => {
    if (editPwd.value) {
      const { current, new: n, confirm } = pwdForm.value
      return !!current && !!n && !!confirm && n === confirm && validatePassword(n).ok
    }
    if (editExtras.value || !hasBirthdate.value) {
      return hasExtrasChanges()
    }
    return false
  })

  function emitCanSave(val){
    window.dispatchEvent(new CustomEvent('bottom-can-save', { detail: { enabled: !!val }}))
  }
  watch(canSave, emitCanSave, { immediate: true })

  /* ========= Load ========= */
  async function loadAll(){
    try{
      const authUser = await getAuthUser()
      if (!authUser) return

      user.value.id = authUser.id
      user.value.email = authUser.email || ''

      user.value.name = await getProfileName(authUser.id)

      const xtra = await getProfileExtras(authUser.id)
      if (xtra){
        extras.value = {
          phone: xtra.phone || '',
          country: xtra.country || '',
          birthdate: normalizeDateStr(xtra.birthdate || ''),
          avatar_url: xtra.avatar_url || ''
        }
      }

      draft.value = {
        phone: extras.value.phone,
        country: extras.value.country,
        birthdate: extras.value.birthdate
      }
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: e.message || 'Error cargando perfil' }
    }
  }
  loadAll()

  /* ===== Exclusividad de edición ===== */
  function enterEditExtras(){
    if (editPwd.value){
      toastErr.value = { open: true, msg: 'Primero cancela la edición de contraseña.' }
      return
    }
    draft.value = {
      phone: extras.value.phone,
      country: extras.value.country,
      birthdate: extras.value.birthdate
    }
    editExtras.value = true
  }

  function cancelEditExtras(){
    editExtras.value = false
    draft.value = {
      phone: extras.value.phone,
      country: extras.value.country,
      birthdate: extras.value.birthdate
    }
  }

  function enterEditPwd(){
    if (editExtras.value){
      toastErr.value = { open: true, msg: 'Primero cancela la edición de Información adicional.' }
      return
    }
    editPwd.value = true
    pwdForm.value = { current: '', new: '', confirm: '' }
    showCurr.value = showNew.value = showConf.value = false
    pwdMsg.value = { text: 'Debe tener ≥8, 1 mayúscula y 1 carácter especial.', color: 'muted' }
  }
  function cancelEditPwd(){ editPwd.value = false }

  /* ===== Guardar extras ===== */
  async function saveExtras(){
    if (!user.value.id) return
    if (!hasExtrasChanges()){
      toast.value = { open: true, msg: 'No hay cambios para guardar.' }
      return
    }
    saving.value = true
    try{
      const finalBirth = hasBirthdate.value ? extras.value.birthdate : normalizeDateStr(draft.value.birthdate)

      const payload = {
        user_id: user.value.id,
        phone: (draft.value.phone || '').trim() || null,
        country: (draft.value.country || '').trim() || null,
        birthdate: finalBirth || null,
        avatar_url: (extras.value.avatar_url || '').trim() || null,
        updated_at: new Date().toISOString()
      }

      await upsertProfileExtras(payload)

      extras.value.phone = payload.phone || ''
      extras.value.country = payload.country || ''
      extras.value.birthdate = payload.birthdate ? normalizeDateStr(payload.birthdate) : ''
      draft.value = {
        phone: extras.value.phone,
        country: extras.value.country,
        birthdate: extras.value.birthdate
      }

      editExtras.value = false
      toast.value = { open: true, msg: 'Perfil actualizado' }
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: e.message || 'No se pudo guardar' }
    }finally{
      saving.value = false
    }
  }

  /* ===== Actualizar contraseña ===== */
  async function savePassword(){
    if (!editPwd.value) return
    savingPwd.value = true
    try{
      if (!pwdForm.value.current){
        pwdMsg.value = { text: 'Ingresa tu contraseña actual.', color: 'danger' }
        throw new Error('NeedCurrent')
      }
      if (pwdForm.value.new !== pwdForm.value.confirm){
        pwdMsg.value = { text: 'Las contraseñas no coinciden.', color: 'danger' }
        throw new Error('Mismatch')
      }
      const chk = validatePassword(pwdForm.value.new)
      if (!chk.ok){
        pwdMsg.value = { text: 'La nueva contraseña no cumple los requisitos.', color: 'danger' }
        throw new Error('WeakPwd')
      }

      await reauthWithPassword(user.value.email, pwdForm.value.current)
      await updatePassword(pwdForm.value.new)
      await refreshSession()

      editPwd.value = false
      toast.value = { open: true, msg: 'Contraseña actualizada' }
    }catch(e){
      console.error(e)
      if (!['NeedCurrent','Mismatch','WeakPwd'].includes(e?.message)){
        toastErr.value = { open: true, msg: e?.message || 'No se pudo actualizar la contraseña' }
      }
    }finally{
      savingPwd.value = false
    }
  }

  /* === Guardar desde navbar inferior (click en botón guardar) === */
  function handleBottomAccept () {
    if (editPwd.value) { savePassword(); return }
    if (editExtras.value || !hasBirthdate.value) saveExtras()
  }

  /* ===== Logout ===== */
  async function logout () {
    try{
      await signOut()
      window.location.href = '/login'
    }catch(e){
      toastErr.value = { open: true, msg: 'Error al cerrar sesión' }
    }
  }

  return {
    // state
    user, extras, draft,
    editExtras, editPwd,
    pwdVisible, fakePwd, pwdForm, showCurr, showNew, showConf,
    saving, savingPwd, pwdMsg,
    toast, toastErr,

    // helpers
    formatDate, validatePassword, hasBirthdate,

    // actions
    enterEditExtras, cancelEditExtras, saveExtras,
    enterEditPwd, cancelEditPwd, savePassword,
    handleBottomAccept, logout,
  }
}
