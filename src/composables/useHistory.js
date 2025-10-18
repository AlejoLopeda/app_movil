// composables/useHistory.js
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as incomeService from '@/services/incomeService'
import * as expenseService from '@/services/expenseService'
import { calendarOutline } from 'ionicons/icons'

function formatMoney(n){
  try { return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) }
  catch { return `$ ${Number(n||0).toLocaleString()}` }
}
function formatDate(iso){
  if(!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES',{year:'numeric',month:'short',day:'2-digit'})
}
function cryptoRandom(){
  try { return crypto.randomUUID?.() || Math.random().toString(36).slice(2) }
  catch { return Math.random().toString(36).slice(2) }
}
function normalizeTab(val){
  const v = String(val ?? '').toLowerCase()
  return ['income','expense','both'].includes(v) ? v : 'income'
}

const KEY = 'history.filters'
function loadFilters(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}') } catch { return {} } }
function saveFilters(obj){ localStorage.setItem(KEY, JSON.stringify(obj)) }

// ✅ helper: intersección
function hasAny(arr, set){ for(const x of arr) if (set.has(x)) return true; return false }

// ===========================================================
export function useHistory(options = {}) {
  const { fixedTab } = options
  const route = useRoute()
  const router = useRouter()

  const init = loadFilters()
  const tab = ref(
    fixedTab ||
    normalizeTab(route.query.tab ?? init.tab)
  )
  const from  = ref(init.from || null)
  const to    = ref(init.to   || null)
  const selectedCats = ref(new Set(init.cats || ['all']))

  const loading = ref(false)
  const error   = ref('')
  const items   = ref([])

  const dateOpen = ref(false)
  const dateEvent = ref(null)   // 👈 NUEVO: para anclar el popover de fechas
  const catOpen  = ref(false)
  const dateError = ref('')

  const incCats = incomeService.presetCategories?.() || []
  const expCats = expenseService.presetCategories?.() || []

  const visibleCategories = computed(() => {
    if (tab.value === 'income')  return incCats
    if (tab.value === 'expense') return expCats
    const map = new Map()
    for (const x of [...incCats, ...expCats]) if (!map.has(x.key)) map.set(x.key, x)
    return [...map.values()]
  })
  function iconFor(key){
    const inc = incomeService.resolveCategory?.(key)
    const exp = expenseService.resolveCategory?.(key)
    return (inc?.icon || exp?.icon || calendarOutline)
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

  // 👇 Ajustado para popover: recibimos el evento del click
  function openDateModal(ev){
    dateEvent.value = ev || null
    dateOpen.value = true
  }
  function openCatModal(){ catOpen.value  = true }
  function clearDates(){ from.value = null; to.value = null; dateError.value='' }
  function applyDates(){
    dateError.value = ''
    if (from.value && to.value && new Date(to.value) < new Date(from.value)){
      dateError.value = 'La fecha final no puede ser menor que la inicial'
      return
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

  // ✅ set de categorías válidas según la pestaña actual
  const validCatKeys = computed(() => new Set(visibleCategories.value.map(c => c.key)))

  // ✅ si la vista usa fixedTab y los filtros guardados NO aplican a esa pestaña, resetea a "Todas"
  onMounted(() => {
    if (fixedTab) {
      tab.value = fixedTab
      if (!selectedCats.value.has('all')) {
        const current = Array.from(selectedCats.value)
        if (!hasAny(current, validCatKeys.value)) {
          selectedCats.value = new Set(['all'])
        }
      }
    }
  })

  async function load(){
    loading.value = true
    error.value = ''
    items.value = []
    try{
      // ✅ saneo de categorías: solo enviar las válidas para la pestaña actual
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
        .map(it => ({
          ...it,
          categoryLabel: (visibleCategories.value.find(c => c.key === it.category)?.label) || '—'
        }))
        .sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))
    }catch(e){
      console.error('[history][load]', e)
      error.value = 'load'
    }finally{
      loading.value = false
    }
  }

  watch(() => route.query.tab, (q) => {
    if (fixedTab) return
    const v = normalizeTab(q)
    if (v !== tab.value) tab.value = v
  })

  // ✅ si cambia la pestaña (o filtros), guarda y recarga
  watch([tab, from, to, selectedCats], () => {
    saveFilters({ tab: tab.value, from: from.value || null, to: to.value || null, cats: Array.from(selectedCats.value) })
    load()
  })

  function onHistoryTab(e){
    if (fixedTab) return
    const mode = normalizeTab(e?.detail?.mode)
    if (mode !== tab.value){
      tab.value = mode
      router.replace({ path:'/historico', query:{ tab: mode } }).catch(()=>{})
    }
  }

  onMounted(() => {
    if (!fixedTab) window.addEventListener('history-tab', onHistoryTab)
    load()
  })
  onBeforeUnmount(() => {
    if (!fixedTab) window.removeEventListener('history-tab', onHistoryTab)
  })

  return {
    tab, from, to, selectedCats, items, loading, error,
    dateOpen, dateEvent, catOpen, dateError,     // 👈 exporta dateEvent
    visibleCategories, allCatsSelected,
    dateLabel, categoriesLabel, chips, emptyMessage,
    formatMoney, formatDate, iconFor,
    openDateModal, openCatModal, clearDates, applyDates,
    toggleAllCats, resetCats, toggleCat, applyCats,
  }
}
