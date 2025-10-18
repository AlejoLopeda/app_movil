import { ref, computed } from 'vue'
import { getCurrentUserId } from '@/services/incomeService'
import {
  fetchMonthlySummary,
  resolveMonthRange
} from '@/services/monthlySummaryService'
import {
  presetCategories as presetExpenseCategories,
  additionalCategories as extraExpenseCategories,
  resolveCategory as resolveExpenseCategory
} from '@/services/expenseService'
import {
  presetCategories as presetIncomeCategories,
  additionalCategories as extraIncomeCategories,
  resolveCategory as resolveIncomeCategory
} from '@/services/incomeService'

const EXPENSE_COLORS = ['#0d3f48', '#236a73', '#498a92', '#f4a259', '#9b3d3d', '#5c677d', '#8c2155', '#3c6e71']
const INCOME_COLORS = ['#2a9d8f', '#3c91e6', '#2f9c95', '#4caf50', '#8bc34a', '#5bc0be', '#6c91bf']

const BASE_INCOME_CATEGORIES = Object.freeze(
  [
    ...presetIncomeCategories(),
    ...extraIncomeCategories(),
    resolveIncomeCategory('saldo_inicial')
  ].filter(Boolean)
)

const BASE_EXPENSE_CATEGORIES = Object.freeze([
  ...presetExpenseCategories(),
  ...extraExpenseCategories()
])

const FALLBACK_CATEGORY = {
  income: { key: '__sin-categoria-ingreso', label: 'Sin categoría' },
  expense: { key: '__sin-categoria-gasto', label: 'Sin categoría' }
}

const colorCaches = {
  income: buildColorCache(BASE_INCOME_CATEGORIES, INCOME_COLORS),
  expense: buildColorCache(BASE_EXPENSE_CATEGORIES, EXPENSE_COLORS)
}

function buildColorCache(categories, palette) {
  const cache = new Map()
  categories.forEach((item, index) => {
    cache.set(item.key, palette[index % palette.length])
  })
  return cache
}

function colorFor(type, key) {
  const cache = colorCaches[type]
  if (cache?.has(key)) return cache.get(key)
  const palette = type === 'income' ? INCOME_COLORS : EXPENSE_COLORS
  const color = palette[cache?.size % palette.length] ?? palette[0]
  cache?.set(key, color)
  return color
}

function labelFor(type, key) {
  if (!key) return FALLBACK_CATEGORY[type].label
  const resolver = type === 'income' ? resolveIncomeCategory : resolveExpenseCategory
  return resolver(key)?.label ?? FALLBACK_CATEGORY[type].label
}

function baseCategoriesFor(type) {
  const list = type === 'income' ? BASE_INCOME_CATEGORIES : BASE_EXPENSE_CATEGORIES
  return list.map((item) => ({
    key: item.key,
    label: item.label,
    type,
    color: colorFor(type, item.key)
  }))
}

function mapRecord(type, record) {
  const rawKey = record.category ?? null
  const info = rawKey ? { key: rawKey, label: labelFor(type, rawKey) } : FALLBACK_CATEGORY[type]
  return {
    id: record.id,
    type,
    amount: Number(record.amount) || 0,
    category: info.key,
    categoryLabel: info.label,
    occurred_on: record.occurred_on ?? null
  }
}

function sumAmounts(list, predicate) {
  return list.reduce((total, item) => total + (predicate(item) ? item.amount : 0), 0)
}

function groupByCategory(records) {
  const map = new Map()
  records.forEach((item) => {
    if (!map.has(item.category)) {
      map.set(item.category, {
        key: item.category,
        type: item.type,
        label: item.categoryLabel,
        amount: 0
      })
    }
    const entry = map.get(item.category)
    entry.amount += Math.max(item.amount, 0)
  })
  return Array.from(map.values())
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function useMonthlySummary(options = {}) {
  const includeIncomes = options.includeIncomes !== false
  const includeExpenses = options.includeExpenses !== false
  const referenceDate = options.monthDate ?? new Date()

  const loading = ref(false)
  const error = ref(null)
  const records = ref([])
  const selectedCategories = ref([])
  const chartMode = ref('pie')
  const userId = ref(null)

  const hasSelection = computed(() => selectedCategories.value.length > 0)
  const selectedSet = computed(() => new Set(selectedCategories.value))

  const filteredRecords = computed(() => {
    if (!hasSelection.value) return records.value
    return records.value.filter((item) => selectedSet.value.has(item.category))
  })

  const categoryTotals = computed(() => {
    const grouped = groupByCategory(filteredRecords.value)
    const sorted = grouped
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
    const grandTotal = sorted.reduce((total, item) => total + item.amount, 0)
    let accumulator = 0
    return sorted.map((item, index) => {
      accumulator += item.amount
      const percentage = grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0
      return {
        ...item,
        percentage,
        color: colorFor(item.type, item.key),
        cumulative: accumulator
      }
    })
  })

  const incomesTotal = computed(() => sumAmounts(filteredRecords.value, (item) => item.type === 'income'))
  const expensesTotal = computed(() => sumAmounts(filteredRecords.value, (item) => item.type === 'expense'))
  const balance = computed(() => incomesTotal.value - expensesTotal.value)

  const availableCategories = computed(() => {
    const seen = new Map()

    if (includeIncomes) {
      baseCategoriesFor('income').forEach((item) => {
        if (!seen.has(item.key)) seen.set(item.key, item)
      })
    }
    if (includeExpenses) {
      baseCategoriesFor('expense').forEach((item) => {
        if (!seen.has(item.key)) seen.set(item.key, item)
      })
    }

    records.value.forEach((item) => {
      if (!seen.has(item.category)) {
        seen.set(item.category, {
          key: item.category,
          label: item.categoryLabel,
          type: item.type,
          color: colorFor(item.type, item.category)
        })
      }
    })

    return Array.from(seen.values())
  })

  const hasData = computed(() => categoryTotals.value.length > 0)
  const isFilteredEmpty = computed(() => hasSelection.value && !hasData.value && records.value.length > 0)

  async function ensureUser() {
    if (userId.value) return userId.value
    userId.value = await getCurrentUserId()
    return userId.value
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      const id = await ensureUser()
      if (!id) throw new Error('No hay usuario autenticado')
      const { incomes, expenses } = await fetchMonthlySummary({
        userId: id,
        includeIncomes,
        includeExpenses,
        monthDate: referenceDate
      })

      const mapped = []
      if (includeIncomes) {
        mapped.push(...incomes.map((row) => mapRecord('income', row)))
      }
      if (includeExpenses) {
        mapped.push(...expenses.map((row) => mapRecord('expense', row)))
      }
      records.value = mapped
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('No se pudo cargar la información mensual')
      records.value = []
    } finally {
      loading.value = false
    }
  }

  function toggleCategory(key) {
    const current = new Set(selectedCategories.value)
    if (current.has(key)) {
      current.delete(key)
    } else {
      current.add(key)
    }
    selectedCategories.value = Array.from(current)
  }

  function clearCategories() {
    selectedCategories.value = []
  }

  function setChartMode(nextMode) {
    chartMode.value = nextMode === 'bar' ? 'bar' : 'pie'
  }

  function formatCurrency(value) {
    return currencyFormatter.format(Math.round(value || 0))
  }

  const monthRange = resolveMonthRange(referenceDate)

  return {
    loading,
    error,
    chartMode,
    monthRange,
    records,
    categoryTotals,
    availableCategories,
    selectedCategories,
    hasSelection,
    hasData,
    isFilteredEmpty,
    incomesTotal,
    expensesTotal,
    balance,
    load,
    toggleCategory,
    clearCategories,
    setChartMode,
    formatCurrency
  }
}
