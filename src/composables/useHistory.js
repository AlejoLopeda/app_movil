// composables/useHistory.js
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as incomeService from '@/services/incomeService'
import * as expenseService from '@/services/expenseService'
import { useAuthUser } from '@/composables/useAuthUser'
import { iconForCategory } from '@/utils/categoryIcons'

function formatMoney(n){
  try { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) }
  catch { return `$ ${Number(n||0).toLocaleString()}` }
}
function isDateOnly(v){ return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) }
function toLocalDate(v){
  if (!v) return null
  if (isDateOnly(v)) { const [y,m,d] = v.split('-').map(Number); return new Date(y, m-1, d, 0,0,0,0) }
  return new Date(v)
}
function formatDate(iso){ if(!iso) return ''; const d = toLocalDate(iso); return d.toLocaleDateString('es-ES',{year:'numeric',month:'short',day:'2-digit'}) }
function cryptoRandom(){ try { return crypto.randomUUID?.() || Math.random().toString(36).slice(2) } catch { return Math.random().toString(36).slice(2) } }
function normalizeTab(val){ const v = String(val ?? '').toLowerCase(); return ['income','expense','both'].includes(v) ? v : 'income' }

const KEY = 'history.filters'
function loadFilters(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}') } catch { return {} } }
function saveFilters(obj){ localStorage.setItem(KEY, JSON.stringify(obj)) }

const KEY_PREFIX = 'history.filters.'
function keyForTab(tab){ return KEY_PREFIX + normalizeTab(tab) }
function loadFiltersByTab(tab){ try { return JSON.parse(localStorage.getItem(keyForTab(tab)) || '{}') } catch { return {} } }
function saveFiltersByTab(tab, obj){ localStorage.setItem(keyForTab(tab), JSON.stringify(obj)) }

function hasAny(arr, set){ for(const x of arr) if (set.has(x)) return true; return false }
function mergeCats(presetFn, addFn){
  const a = presetFn?.() || []
  const b = addFn?.() || []
  const map = new Map()
  for (const c of [...a, ...b]) if (!map.has(c.key)) map.set(c.key, c)
  return [...map.values()]
}

// ===========================================================
export function useHistory(options = {}) {
  const { fixedTab } = options
  const route = useRoute()
  const router = useRouter()

  // ✅ auth cache (sin getUser extra)
  const { user, isLoggedIn } = useAuthUser()

  // Estado base
  const init = loadFilters()
  const tab = ref(fixedTab || normalizeTab(route.query.tab ?? init.tab))
  const from  = ref(init.from || null)
  const to    = ref(init.to   || null)
  const selectedCats = ref(new Set(init.cats || ['all']))

  // Carga por pestaña (si existe)
  const initialPerTab = loadFiltersByTab(fixedTab || tab.value)
  if (initialPerTab && (initialPerTab.from || initialPerTab.to || initialPerTab.cats)){
    from.value = initialPerTab.from ?? from.value
    to.value   = initialPerTab.to ?? to.value
    if (initialPerTab.cats) selectedCats.value = new Set(initialPerTab.cats)
  }

  const loading = ref(false)
  const error   = ref('')
  const items   = ref([])

  const dateOpen = ref(false)
  const dateEvent = ref(null)
  const catOpen  = ref(false)
  const dateError = ref('')

  // Evitar dobles cargas iniciales
  const ready = ref(false)

  // Categorías
  const incCats = mergeCats(incomeService.presetCategories, incomeService.additionalCategories)
  const expCats = mergeCats(expenseService.presetCategories, expenseService.additionalCategories)

  const visibleCategories = computed(() => {
    if (tab.value === 'income')  return incCats
    if (tab.value === 'expense') return expCats
    const map = new Map()
    for (const x of [...incCats, ...expCats]) if (!map.has(x.key)) map.set(x.key, x)
    return [...map.values()]
  })
  function iconFor(key){
    return iconForCategory(key)
  }
  function labelFor(key){
    return (
      incomeService.resolveCategory?.(key)?.label ||
      expenseService.resolveCategory?.(key)?.label ||
      '—'
    )
  }

  const dateLabel = computed(() => {
    if (!from.value && !to.value) return 'Fecha: Todas'
    const a = from.value ? formatDate(from.value) : '—'
    const b = to.value ? formatDate(to.value) : '—'
    return `Fecha: ${a} → ${b}`
  })
  const categoriesLabel = computed(() => {
    if (selectedCats.value.has('all')) return 'Categorías: Todas'
    return `Categorías: ${selectedCats.value.size}`
  })
  const chips = computed(() => {
    const out = []
    if (from.value || to.value) out.push(dateLabel.value.replace('Fecha: ', ''))
    if (selectedCats.value.has('all')) out.push('Todas las categorías')
    else {
      const labels = visibleCategories.value
        .filter(c => selectedCats.value.has(c.key))
        .map(c => c.label)
      if (labels.length) out.push(labels.join(', '))
    }
    return out
  })

  const allCatsSelected = computed(() => selectedCats.value.has('all'))
  const emptyMessage = computed(() => {
    if (!from.value && !to.value && selectedCats.value.has('all') && !items.value.length){
      return tab.value==='income' ? 'No hay ingresos registrados.'
           : tab.value==='expense' ? 'No hay gastos registrados.'
           : 'No hay registros.'
    }
    return tab.value==='expense' ? 'No hay gastos en este rango/categoría.'
                                  : 'No hay ingresos en este rango/categoría.'
  })

  // Modales
  function openDateModal(ev){ dateEvent.value = ev || null; dateOpen.value = true }
  function openCatModal(){ catOpen.value = true }
  function clearDates(){ from.value = null; to.value = null; dateError.value='' }
  function applyDates(){
    dateError.value = ''
    if (from.value && to.value){
      if (toLocalDate(to.value) < toLocalDate(from.value)){
        dateError.value = 'La fecha final no puede ser menor que la inicial'
        return
      }
    }
    dateOpen.value = false
  }
  function toggleAllCats(){ selectedCats.value = new Set(['all']) }
  function resetCats(){ selectedCats.value = new Set(['all']) }
  function toggleCat(key){
    const s = new Set(selectedCats.value)
    if (s.has('all')) s.delete('all')
    if (s.has(key)) s.delete(key); else s.add(key)
    if (s.size === 0) s.add('all')
    selectedCats.value = s
  }
  function applyCats(){ catOpen.value = false }

  const validCatKeys = computed(() => new Set(visibleCategories.value.map(c => c.key)))

  function shouldReloadFor(type){
    if (!type || type === 'all') return true
    if (tab.value === 'both') return true
    return tab.value === type
  }
  function onTransactionsChanged(event){
    const type = event?.detail?.type || 'all'
    if (!shouldReloadFor(type)) return
    load()
  }

  onMounted(async () => {
    if (fixedTab) {
      // siempre inicia limpio si la vista es fija
      from.value = null
      to.value = null
      selectedCats.value = new Set(['all'])
      tab.value = fixedTab
    }
    // primera carga: solo si hay sesión
    if (isLoggedIn()) {
      await load()
    } else {
      items.value = []
    }
    ready.value = true
    if (!fixedTab) window.addEventListener('history-tab', onHistoryTab)
    window.addEventListener('data:transactions-changed', onTransactionsChanged)
  })

  onBeforeUnmount(() => {
    if (!fixedTab) window.removeEventListener('history-tab', onHistoryTab)
    window.removeEventListener('data:transactions-changed', onTransactionsChanged)
  })

  async function load(){
    // ⛔ no consultar nada si no hay usuario autenticado
    if (!isLoggedIn()) {
      loading.value = false
      error.value = ''
      items.value = []
      return
    }

    loading.value = true
    error.value = ''
    items.value = []
    try{
      let cats
      if (!selectedCats.value.has('all')) {
        const filtered = Array.from(selectedCats.value).filter(k => validCatKeys.value.has(k))
        cats = filtered.length ? filtered : undefined
      }
      const filter = { from: from.value || undefined, to: to.value || undefined, categories: cats }

      const tasks = []
      if (tab.value === 'income' || tab.value === 'both'){
        tasks.push(
          incomeService.list?.(filter).then(arr =>
            (arr||[]).map(x => ({
              id: `inc-${x.id ?? cryptoRandom()}`,
              type: 'income',
              title: x.description || x.descripcion || x.titulo || 'Ingreso',
              amount: Number(x.amount ?? x.monto ?? 0),
              date:   x.occurred_on || x.fecha,
              category: x.category_key || x.categoria
            }))
          )
        )
      }
      if (tab.value === 'expense' || tab.value === 'both'){
        tasks.push(
          expenseService.list?.(filter).then(arr =>
            (arr||[]).map(x => ({
              id: `exp-${x.id ?? cryptoRandom()}`,
              type: 'expense',
              title: x.description || x.descripcion || x.titulo || 'Gasto',
              amount: Number(x.amount ?? x.monto ?? 0),
              date:   x.occurred_on || x.fecha,
              category: x.category_key || x.categoria
            }))
          )
        )
      }

      const flat = (await Promise.all(tasks)).flat()
      items.value = flat
        .map(it => ({ ...it, categoryLabel: labelFor(it.category) }))
        .sort((a,b) => toLocalDate(b.date || 0) - toLocalDate(a.date || 0))
    }catch(e){
      console.error('[history][load]', e)
      error.value = 'load'
    }finally{
      loading.value = false
    }
  }

  // 👉 recargar cuando cambie el usuario (login/logout)
  watch(user, () => {
    if (!ready.value) return
    load()
  })

  // 👉 watchers optimizados: solo corren tras ready
  watch(() => route.query.tab, (q) => {
    if (fixedTab) return
    const v = normalizeTab(q)
    if (v !== tab.value) tab.value = v
  })

  watch([tab, from, to, selectedCats], () => {
    if (!ready.value) return
    saveFilters({ tab: tab.value, from: from.value || null, to: to.value || null, cats: Array.from(selectedCats.value) })
    load()
  })

  watch([from, to, selectedCats, tab], () => {
    if (!ready.value) return
    saveFiltersByTab(tab.value, { from: from.value || null, to: to.value || null, cats: Array.from(selectedCats.value) })
  })

  watch(tab, (now, prev) => {
    if (!ready.value) return
    if (fixedTab) return
    if (now !== prev) {
      from.value = null
      to.value = null
      selectedCats.value = new Set(['all'])
    }
  })

  function onHistoryTab(e){
    if (fixedTab) return
    const mode = normalizeTab(e?.detail?.mode)
    if (mode !== tab.value){
      tab.value = mode
      router.replace({ path:'/historico', query:{ tab: mode } }).catch(()=>{})
    }
  }

  return {
    tab, from, to, selectedCats, items, loading, error,
    dateOpen, dateEvent, catOpen, dateError,
    visibleCategories, allCatsSelected,
    dateLabel, categoriesLabel, chips, emptyMessage,
    formatMoney, formatDate, iconFor,
    openDateModal, openCatModal, clearDates, applyDates,
    toggleAllCats, resetCats, toggleCat, applyCats,
  }
}

