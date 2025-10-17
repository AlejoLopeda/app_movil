import { supabase } from '@/lib/supabaseClient'

const TABLE_CONFIG = {
  income: {
    table: 'ingresos',
    amountField: 'monto',
    categoryField: 'categoria',
    dateField: 'fecha'
  },
  expense: {
    table: 'gastos',
    amountField: 'monto',
    categoryField: 'categoria',
    dateField: 'fecha'
  }
}

function formatDateOnly(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resolveMonthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
  return {
    start: formatDateOnly(start),
    end: formatDateOnly(end)
  }
}

async function fetchByType(type, userId, monthDate = new Date()) {
  if (!userId) return []
  const config = TABLE_CONFIG[type]
  if (!config) return []

  const { start, end } = resolveMonthRange(monthDate)
  const { table, amountField, categoryField, dateField } = config

  const { data, error } = await supabase
    .from(table)
    .select(`id, ${amountField}, ${categoryField}, ${dateField}`)
    .eq('user_id', userId)
    .gte(dateField, start)
    .lte(dateField, end)

  if (error) throw error

  if (!Array.isArray(data)) return []

  return data
    .map((row, idx) => {
      const amount = Number(row?.[amountField]) || 0
      const occurred_on = row?.[dateField] ?? null
      const category = row?.[categoryField] ?? null
      const id = row?.id ?? `${type}-${idx}-${occurred_on ?? 'na'}`
      return { id, amount, category, occurred_on, type }
    })
}

export async function fetchMonthlySummary({ userId, includeIncomes = true, includeExpenses = true, monthDate = new Date() }) {
  const results = {
    incomes: [],
    expenses: []
  }

  const tasks = []

  if (includeIncomes) {
    tasks.push(
      fetchByType('income', userId, monthDate)
        .then((rows) => { results.incomes = rows })
    )
  }

  if (includeExpenses) {
    tasks.push(
      fetchByType('expense', userId, monthDate)
        .then((rows) => { results.expenses = rows })
    )
  }

  if (tasks.length === 0) return results

  await Promise.all(tasks)
  return results
}

export { resolveMonthRange }
