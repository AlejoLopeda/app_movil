// src/composables/useProfile.js
import { ref, computed, watch, onMounted } from 'vue'
import { formatDate, normalizeDateStr } from '@/lib/date'
import {
  getProfileName,
  getProfileExtras,
  upsertProfileExtras,
  reauthWithPassword,
  updatePassword,
  refreshSession,
  signOut,
} from '@/services/profileService'
import { useAuthUser } from '@/composables/useAuthUser'
import { getCountriesES } from '@/services/countryService'

export function useProfile(){
  const { user: authUser } = useAuthUser()

  const user   = ref({ id: '', name: '', email: '' })
  const extras = ref({ phone: '', country: '', birthdate: '', avatar_url: '' })

  const editExtras = ref(false)
  const draft = ref({ phone: '', country: '', birthdate: '' })

  /* ========== Países (ES) ========== */
  const countries = ref([])
  const normalizedCountry = (raw) => {
    const txt = (raw || '').trim().toLowerCase()
    if (!txt) return ''
    const hit = countries.value.find(c => c.toLowerCase() === txt)
    return hit || ''
  }
  onMounted(async () => { countries.value = await getCountriesES() })

  /* ========== Password (UI/estado) ========== */
  const editPwd = ref(false)
  const pwdVisible = ref(false)
  const fakePwd = '************'
  const pwdForm = ref({ current: '', new: '', confirm: '' })
  const showCurr = ref(false)
  const showNew  = ref(false)
  const showConf = ref(false)
  const savingPwd = ref(false)

  // Errores específicos por campo (para notas bajo inputs)
  const currentPwdError = ref('')
  const newPwdError = ref('')
  const confirmPwdError = ref('')

  // Mensaje informativo genérico (sigue existiendo para mantener compatibilidad)
  const pwdMsg = ref({
    text: 'Debe tener ≥8 caracteres, e incluir mayúscula, minúscula, número y símbolo.',
    color: 'muted'
  })

  /* ========== Estado UI general ========== */
  const saving = ref(false)
  const toast = ref({ open: false, msg: '' })
  const toastErr = ref({ open: false, msg: '' })

  /* ========== Helpers / Validaciones ========== */
  const RX_UPPER = /[A-Z]/
  const RX_LOWER = /[a-z]/
  const RX_DIGIT = /\d/
  const RX_SPECIAL = /[^A-Za-z0-9]/

  function validatePassword(p){
    const s = p || ''
    const tooShort = s.length < 8
    const missingUpper = !RX_UPPER.test(s)
    const missingLower = !RX_LOWER.test(s)
    const missingDigit = !RX_DIGIT.test(s)
    const missingSpecial = !RX_SPECIAL.test(s)
    const ok = !(tooShort || missingUpper || missingLower || missingDigit || missingSpecial)
    return { ok, tooShort, missingUpper, missingLower, missingDigit, missingSpecial }
  }

  function passwordRulesError(p){
    const res = validatePassword(p)
    if (!p) return ''
    if (res.ok) return ''
    const parts = []
    if (res.tooShort) parts.push('≥8 caracteres')
    if (res.missingUpper) parts.push('mayúsculas')
    if (res.missingLower) parts.push('minúsculas')
    if (res.missingDigit) parts.push('números')
    if (res.missingSpecial) parts.push('símbolos')
    return `Debe incluir: ${parts.join(', ')}.`
  }

  const hasBirthdate = computed(() => !!normalizeDateStr(extras.value.birthdate))
  function setDraftFromExtras(){
    draft.value = {
      phone: extras.value.phone,
      country: extras.value.country,
      birthdate: extras.value.birthdate
    }
  }

  /* ========== Validaciones específicas de los campos (extras) ========== */
  // Teléfono: CO exacto (10 dígitos)
  const phoneRaw = computed({
    get: () => draft.value.phone || '',
    set: v => { draft.value.phone = (v || '').replace(/\D+/g, '') }
  })
  const phoneDigits = computed(() => (draft.value.phone || '').replace(/\D+/g,''))
  const phoneValid = computed(() => phoneDigits.value.length === 10)
  const phoneError = computed(() => {
    const val = draft.value.phone || ''
    if (!val) return '' // opcional
    if (/[^0-9]/.test(val)) return 'Solo números (sin espacios, signos ni letras).'
    if (phoneDigits.value.length !== 10) return 'Debe tener exactamente 10 dígitos.'
    return ''
  })

  // País: debe coincidir con la lista oficial en español
  const countryValid = computed(() => {
    const raw = (draft.value.country || '').trim()
    if (!raw) return true
    return !!normalizedCountry(raw)
  })
  const countryError = computed(() => {
    const raw = (draft.value.country || '').trim()
    if (!raw) return ''
    return countryValid.value ? '' : 'Escribe un país válido.'
  })

  function hasExtrasChanges(){
    const d = draft.value, x = extras.value
    return (
      (d.phone ?? '').trim()   !== (x.phone ?? '') ||
      (d.country ?? '').trim() !== (x.country ?? '') ||
      (!hasBirthdate.value && !!(d.birthdate || '').trim())
    )
  }

  /* ========== Bottom bar (habilitar ACTUALIZAR) ========== */
  const canSave = computed(() => {
    if (editPwd.value) {
      const { current, new: n, confirm } = pwdForm.value
      return !!current && !!n && !!confirm && n === confirm && validatePassword(n).ok
    }
    if (editExtras.value || !hasBirthdate.value) {
      const valid = (!draft.value.phone || phoneValid.value) && countryValid.value
      return hasExtrasChanges() && valid
    }
    return false
  })
  function emitCanSave(val){
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('bottom-can-save', { detail: { enabled: !!val }}))
    })
  }
  watch(canSave, emitCanSave, { immediate: true })

  /* ========== Carga inicial ========== */
  let loadToken = 0
  async function loadAll(){
    const u = authUser.value
    if (!u) return
    const token = ++loadToken
    try{
      user.value.id = u.id
      user.value.email = u.email || ''

      const [name, xtra] = await Promise.all([
        getProfileName(u.id),
        getProfileExtras(u.id),
      ])
      if (token !== loadToken) return

      user.value.name = name || ''
      if (xtra){
        extras.value = {
          phone: xtra.phone || '',
          country: xtra.country || '',
          birthdate: normalizeDateStr(xtra.birthdate || ''),
          avatar_url: xtra.avatar_url || ''
        }
      }else{
        extras.value = { phone:'', country:'', birthdate:'', avatar_url:'' }
      }
      setDraftFromExtras()
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: e?.message || 'Error cargando perfil' }
    }
  }
  watch(() => authUser.value?.id, () => loadAll(), { immediate: true })

  /* ========== Exclusividad de edición ========== */
  function enterEditExtras(){
    if (editPwd.value){
      toastErr.value = { open: true, msg: 'Primero cancela la edición de contraseña.' }
      return
    }
    setDraftFromExtras()
    editExtras.value = true
  }
  function cancelEditExtras(){ editExtras.value = false; setDraftFromExtras() }
  function enterEditPwd(){
    if (editExtras.value){
      toastErr.value = { open: true, msg: 'Primero cancela la edición de Información adicional.' }
      return
    }
    editPwd.value = true
    pwdForm.value = { current: '', new: '', confirm: '' }
    showCurr.value = showNew.value = showConf.value = false
    currentPwdError.value = ''
    newPwdError.value = ''
    confirmPwdError.value = ''
    pwdMsg.value = {
      text: 'Debe tener ≥8 caracteres, e incluir mayúscula, minúscula, número y símbolo.',
      color: 'muted'
    }
  }
  function cancelEditPwd(){ editPwd.value = false }

  /* ========== Guardar extras ========== */
  async function saveExtras(){
    if (!user.value.id) return

    if (draft.value.phone && !phoneValid.value){
      toastErr.value = { open: true, msg: 'Número de teléfono inválido.' }
      return
    }
    if (!countryValid.value){
      toastErr.value = { open: true, msg: 'Selecciona un país válido.' }
      return
    }
    if (!hasExtrasChanges()){
      toast.value = { open: true, msg: 'No hay cambios para guardar.' }
      return
    }

    saving.value = true
    try{
      const finalBirth = hasBirthdate.value ? extras.value.birthdate : normalizeDateStr(draft.value.birthdate)
      const countryNorm = normalizedCountry(draft.value.country) || ''

      const payload = {
        user_id: user.value.id,
        phone: phoneDigits.value || null,
        country: countryNorm || null,
        birthdate: finalBirth || null,
        avatar_url: (extras.value.avatar_url || '').trim() || null,
        updated_at: new Date().toISOString()
      }

      await upsertProfileExtras(payload)

      extras.value.phone = payload.phone || ''
      extras.value.country = payload.country || ''
      extras.value.birthdate = payload.birthdate ? normalizeDateStr(payload.birthdate) : ''
      setDraftFromExtras()
      editExtras.value = false
      toast.value = { open: true, msg: 'Perfil actualizado' }
    }catch(e){
      console.error(e)
      toastErr.value = { open: true, msg: e?.message || 'No se pudo guardar' }
    }finally{
      saving.value = false
    }
  }

  /* ========== Guardar contraseña ========== */
  // Limpiar errores por campo cuando el usuario escribe
  watch(() => pwdForm.value.current, () => { currentPwdError.value = '' })
  watch(() => pwdForm.value.new,     () => { newPwdError.value = passwordRulesError(pwdForm.value.new) })
  watch(() => pwdForm.value.confirm, () => {
    confirmPwdError.value = pwdForm.value.confirm && pwdForm.value.confirm !== pwdForm.value.new
      ? 'Las contraseñas no coinciden.'
      : ''
  })

  async function savePassword(){
    if (!editPwd.value) return
    currentPwdError.value = ''
    newPwdError.value = passwordRulesError(pwdForm.value.new)
    confirmPwdError.value = (pwdForm.value.confirm && pwdForm.value.confirm !== pwdForm.value.new)
      ? 'Las contraseñas no coinciden.'
      : ''

    // Validaciones de front antes de llamar al backend
    if (!pwdForm.value.current) {
      currentPwdError.value = 'Ingresa tu contraseña actual.'
      return
    }
    if (newPwdError.value) return
    if (!pwdForm.value.confirm) {
      confirmPwdError.value = 'Confirma tu nueva contraseña.'
      return
    }
    if (confirmPwdError.value) return

    savingPwd.value = true
    try{
      await reauthWithPassword(user.value.email, pwdForm.value.current)
      await updatePassword(pwdForm.value.new)
      await refreshSession()

      editPwd.value = false
      toast.value = { open: true, msg: 'Contraseña actualizada' }
    }catch(e){
      console.error(e)
      // Mostrar inline si es credencial inválida
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('invalid') || msg.includes('credencial') || msg.includes('password')) {
        currentPwdError.value = 'Contraseña actual no válida.'
      } else {
        toastErr.value = { open: true, msg: e?.message || 'No se pudo actualizar la contraseña' }
      }
    }finally{
      savingPwd.value = false
    }
  }

  /* ========== Bottom bar: click guardar ========== */
  function handleBottomAccept () {
    if (editPwd.value) { savePassword(); return }
    if (editExtras.value || !hasBirthdate.value) saveExtras()
  }

  /* ========== Logout ========== */
  async function logout () {
    try{ await signOut(); window.location.href = '/login' }
    catch(e){ toastErr.value = { open: true, msg: 'Error al cerrar sesión' } }
  }

  return {
    // state
    user, extras, draft,
    editExtras, editPwd,
    pwdVisible, fakePwd, pwdForm, showCurr, showNew, showConf,
    saving, savingPwd, pwdMsg,
    toast, toastErr,

    // helpers / validaciones
    formatDate, hasBirthdate,
    countries,
    phoneRaw, phoneValid, phoneError,
    countryValid, countryError,

    // errores inline password
    currentPwdError, newPwdError, confirmPwdError,

    // actions
    enterEditExtras, cancelEditExtras, saveExtras,
    enterEditPwd, cancelEditPwd, handleBottomAccept, logout,
  }
}
