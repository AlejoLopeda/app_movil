<template>
  <section class="monthly-section">
    <header class="monthly-header">
      <div>
        <h2 class="monthly-header__title">Resumen mensual</h2>
        <p class="monthly-header__subtitle">{{ monthLabel }}</p>
      </div>
      <div class="monthly-header__controls">
        <div class="monthly-header__toggle">
          <span>Pastel</span>
          <ion-toggle mode="ios" :checked="chartMode === 'bar'" @ionChange="onModeChange" />
          <span>Barras</span>
        </div>
        <button v-if="hasSelection" type="button" class="monthly-filter-btn" @click="clearFilters">
          Quitar filtros
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="monthly-error">{{ errorMessage }}</div>

    <div v-if="loading" class="monthly-spinner"><ion-spinner name="crescent" /></div>

    <monthly-chart
      v-if="!loading && hasData"
      :mode="chartMode"
      :items="chartItems"
      :active-key="activeKey"
      :formatter="formatCurrency"
      @select="setActiveKey"
    />

    <p v-if="!loading && isFilteredEmpty" class="monthly-feedback">No hay registros en las categorías seleccionadas.</p>
    <p v-else-if="!loading && !hasData" class="monthly-empty">No hay datos registrados este mes.</p>

    <div v-if="detailItem" class="monthly-feedback">
      {{ detailItem.label }} · {{ formatCurrency(detailItem.amount) }} ({{ detailItem.percentage.toFixed(1) }}%)
    </div>

    <div class="monthly-summary-grid">
      <div v-if="showIncomeCard" class="monthly-summary-card monthly-summary-card--income">
        <div class="monthly-summary-card__label">Ingresos del mes</div>
        <div class="monthly-summary-card__value">{{ formatCurrency(incomesTotal) }}</div>
      </div>

      <div v-if="showExpenseCard" class="monthly-summary-card monthly-summary-card--expense">
        <div class="monthly-summary-card__label">Gastos del mes</div>
        <div class="monthly-summary-card__value">{{ formatCurrency(expensesTotal) }}</div>
      </div>

      <div v-if="showBalanceCard" class="monthly-summary-card" :class="balanceClass">
        <div class="monthly-summary-card__label">Balance</div>
        <div class="monthly-summary-card__value">{{ formatCurrency(balance) }}</div>
        <div class="monthly-summary-card__meta">{{ balance >= 0 ? 'Superávit' : 'Déficit' }}</div>
      </div>
    </div>

    <div v-if="categories.length" class="monthly-filters">
      <button
        type="button"
        class="monthly-filter-btn monthly-filter-btn--all"
        :class="{ active: !hasSelection }"
        @click="clearFilters"
      >
        Todas
      </button>
      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        class="monthly-filter-btn"
        :class="{ active: selectedCategories.includes(category.key) }"
        :style="{ '--monthly-filter-border': category.color }"
        @click="toggleCategory(category.key)"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="monthly-actions">
      <ion-button v-if="showIncomeAction" expand="block" router-link="/ingresos/nuevo">
        <ion-icon slot="start" :icon="addIncomeIcon" />
        Nuevo ingreso
      </ion-button>

      <ion-button v-if="showExpenseAction" expand="block" router-link="/gastos/nuevo" color="light" class="secondary">
        <ion-icon slot="start" :icon="addExpenseIcon" />
        Nuevo gasto
      </ion-button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { IonToggle, IonSpinner, IonButton, IonIcon } from '@ionic/vue'
import { cardOutline, cashOutline } from 'ionicons/icons'
import MonthlyChart from '@/components/MonthlyChart.vue'
import { useMonthlySummary } from '@/composables/useMonthlySummary'
import '@/theme/MonthlyPanel.css'

const props = defineProps({
  panelType: { type: String, default: 'all', validator: v => ['all','income','expense'].includes(v) }
})

const config = computed(() => {
  if (props.panelType === 'income') {
    return { includeIncomes: true, includeExpenses: false, showIncomeCard: true, showExpenseCard: false, showBalanceCard: false, showIncomeAction: true, showExpenseAction: false }
  }
  if (props.panelType === 'expense') {
    return { includeIncomes: false, includeExpenses: true, showIncomeCard: false, showExpenseCard: true, showBalanceCard: false, showIncomeAction: false, showExpenseAction: true }
  }
  return { includeIncomes: true, includeExpenses: true, showIncomeCard: true, showExpenseCard: true, showBalanceCard: true, showIncomeAction: true, showExpenseAction: true }
})

const summary = useMonthlySummary({
  includeIncomes:  config.value.includeIncomes,
  includeExpenses: config.value.includeExpenses
})

const activeKey = ref(null)

const chartItems        = computed(() => summary.categoryTotals.value)
const hasData           = computed(() => summary.hasData.value)
const isFilteredEmpty   = computed(() => summary.isFilteredEmpty.value)
const hasSelection      = computed(() => summary.hasSelection.value)
const categories        = computed(() => summary.availableCategories.value)
const selectedCategories= computed(() => summary.selectedCategories.value)
const chartMode         = computed(() => summary.chartMode.value)
const loading           = computed(() => summary.loading.value)
const errorMessage      = computed(() => summary.error.value?.message ?? null)

const incomesTotal = computed(() => summary.incomesTotal.value)
const expensesTotal = computed(() => summary.expensesTotal.value)
const balance       = computed(() => summary.balance.value)

const showIncomeCard   = computed(() => config.value.showIncomeCard)
const showExpenseCard  = computed(() => config.value.showExpenseCard)
const showBalanceCard  = computed(() => config.value.showBalanceCard)
const showIncomeAction = computed(() => config.value.showIncomeAction)
const showExpenseAction= computed(() => config.value.showExpenseAction)

const addIncomeIcon  = computed(() => cashOutline)
const addExpenseIcon = computed(() => cardOutline)

const detailItem = computed(() => !activeKey.value ? null : chartItems.value.find(i => i.key === activeKey.value) ?? null)
const balanceClass = computed(() => ({ 'monthly-summary-card--positive': balance.value >= 0, 'monthly-summary-card--negative': balance.value < 0 }))

const monthLabel = computed(() => {
  const { start, end } = summary.monthRange
  return `Del ${formatDateLabel(start)} al ${formatDateLabel(end)}`
})
function formatDateLabel(value){
  if (!value) return ''
  const [y,m,d] = value.split('-')
  const date = new Date(Number(y), Number(m)-1, Number(d))
  return date.toLocaleDateString('es-CO',{day:'2-digit', month:'short'})
}

function onModeChange(e){ summary.setChartMode(e.detail?.checked ? 'bar' : 'pie') }
function setActiveKey(key){ activeKey.value = key }
function toggleCategory(key){ summary.toggleCategory(key) }
function clearFilters(){ summary.clearCategories() }
const formatCurrency = v => summary.formatCurrency(v)

watch(chartItems, (items) => {
  if (!items.length) { activeKey.value = null; return }
  if (!activeKey.value || !items.some(it => it.key === activeKey.value)) activeKey.value = items[0].key
})

onMounted(() => { summary.load() })
</script>

<style scoped>
/* Tus estilos originales + pequeños ajustes de contraste ya están en tu CSS global */
.monthly-header__title { color: #000000ff; }
.monthly-spinner { display: grid; place-items: center; padding: 24px 0; }
.monthly-summary-card--positive { background: linear-gradient(135deg, #2a9d8f, #4caf50); }
.monthly-summary-card--negative { background: linear-gradient(135deg, #a63a50, #f07167); }
.monthly-header__subtitle { margin-top: 4px; font-size: .9rem; font-weight: 600; color: #041c21; }
@media (prefers-color-scheme: dark) {
  .monthly-header__title { color: rgba(224,242,249,.96) }
  .monthly-header__subtitle { color: rgba(224,242,249,.72) }
}
</style>

