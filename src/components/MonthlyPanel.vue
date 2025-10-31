<template>
  <section class="monthly-section">
    <!-- CARD CONTENEDORA -->
    <div class="monthly-card">
      <header class="monthly-header">
        <div>
          <h2 class="monthly-header__title">Resumen mensual</h2>
          <p class="monthly-header__subtitle">{{ monthLabel }}</p>
        </div>

        <!-- Controles: Categorías (blanco y ancho) + Switch -->
        <div class="monthly-header__controls">
          <button
            type="button"
            class="monthly-filter-btn monthly-filter-btn--cats"
            @click="openCats = true"
            aria-label="Elegir categorías"
          >
            <ion-icon :icon="gridIcon" />
            <span>{{ categoriesLabel }}</span>
          </button>

          <div class="monthly-header__toggle">
            <span>Pastel</span>
            <ion-toggle
              mode="ios"
              :checked="chartMode === 'bar'"
              @ionChange="onModeChange"
            />
            <span>Barras</span>
          </div>

          <button
            v-if="hasSelection"
            type="button"
            class="monthly-filter-btn monthly-filter-btn--clear"
            @click="clearFilters"
          >
            Quitar filtros
          </button>
        </div>
      </header>

      <!-- Chips seleccionadas -->
      <section
        v-if="hasSelection && selectedLabels.length"
        class="monthly-chips"
      >
        <span v-for="c in selectedLabels" :key="c" class="chip">{{ c }}</span>
      </section>

      <!-- Modal de categorías -->
      <ion-modal
        :is-open="openCats"
        @didDismiss="openCats = false"
        :keep-contents-mounted="true"
        backdrop-dismiss="true"
        style="
          --width: min(620px, 92vw);
          --height: auto;
          --max-height: 80vh;
          --border-radius: 20px;
        "
      >
        <div class="modal cat-modal">
          <header>
            <h3>Categorías</h3>
            <p>Selecciona una o más. Siempre habrá al menos una.</p>
          </header>

          <div class="cat-grid">
            <button
              class="cat-chip"
              :class="{ active: !hasSelection }"
              @click="clearFilters"
            >
              Todas
            </button>

            <button
              v-for="c in categories"
              :key="c.key"
              class="cat-chip"
              :class="{ active: selectedCategories.includes(c.key) }"
              @click="toggleCategory(c.key)"
            >
              <ion-icon :icon="categoryIcon(c.key)" />
              <span>{{ c.label }}</span>
            </button>
          </div>

          <div class="modal-actions actions-row">
            <ion-button class="btn-primary" @click="clearFilters">
              RESTABLECER
            </ion-button>
            <ion-button class="btn-primary" @click="applyCats">
              APLICAR
            </ion-button>
          </div>

          <div class="close-row">
            <ion-button class="btn-primary" @click="openCats = false">
              CERRAR
            </ion-button>
          </div>
        </div>
      </ion-modal>

      <!-- Estado -->
      <div v-if="errorMessage" class="monthly-error">{{ errorMessage }}</div>
      <div v-if="loading" class="monthly-spinner">
        <ion-spinner name="crescent" />
      </div>

      <!-- Gráfica (centrada) -->
      <monthly-chart
        v-if="!loading && hasData"
        :mode="chartMode"
        :items="chartItems"
        :active-key="activeKey"
        :formatter="formatCurrency"
        @select="setActiveKey"
        class="monthly-chart"
      />

      <!-- Vacíos -->
      <p v-if="!loading && isFilteredEmpty" class="monthly-feedback">
        No hay registros en las categorías seleccionadas.
      </p>
      <p v-else-if="!loading && !hasData" class="monthly-empty">
        No hay datos registrados este mes.
      </p>

      <!-- Detalle seleccionado -->
      <div v-if="detailItem" class="monthly-feedback">
        {{ detailItem.label }} · {{ formatCurrency(detailItem.amount) }}
        ({{ detailItem.percentage.toFixed(1) }}%)
      </div>

      <!-- Resumen -->
      <div class="monthly-summary-grid">
        <div
          v-if="showIncomeCard"
          class="monthly-summary-card monthly-summary-card--income"
        >
          <div class="monthly-summary-card__label">INGRESOS DEL MES</div>
          <div class="monthly-summary-card__value">
            {{ formatCurrency(incomesTotal) }}
          </div>
        </div>

        <div
          v-if="showExpenseCard"
          class="monthly-summary-card monthly-summary-card--expense"
        >
          <div class="monthly-summary-card__label">GASTOS DEL MES</div>
          <div class="monthly-summary-card__value">
            {{ formatCurrency(expensesTotal) }}
          </div>
        </div>

        <div
          v-if="showBalanceCard"
          class="monthly-summary-card"
          :class="balanceClass"
        >
          <div class="monthly-summary-card__label">BALANCE</div>
          <div class="monthly-summary-card__value">
            {{ formatCurrency(balance) }}
          </div>
          <div class="monthly-summary-card__meta">
            {{ balance >= 0 ? 'Superávit' : 'Déficit' }}
          </div>
        </div>
      </div>

      <!-- Acciones: mostrar botón de Crear según el tipo de panel (income/expense)
           No se muestran en el panel combinado (balance) según lo solicitado. -->
      <div v-if="(showIncomeAction || showExpenseAction) && panelType !== 'all'" class="monthly-actions">
        <ion-button
          v-if="showIncomeAction"
          expand="block"
          @click="openAddIncome"
        >
          Crear ingreso
        </ion-button>

        <ion-button
          v-if="showExpenseAction"
          expand="block"
          class="secondary"
          @click="openAddExpense"
        >
          Crear gasto
        </ion-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { IonToggle, IonSpinner, IonButton, IonIcon, IonModal } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { gridOutline } from 'ionicons/icons'
import MonthlyChart from '@/components/MonthlyChart.vue'
import { useMonthlySummary } from '@/composables/useMonthlySummary'
import { iconForCategory } from '@/utils/categoryIcons'

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

const openCats = ref(false)

const activeKey           = ref(null)
const chartItems          = computed(() => summary.categoryTotals.value)
const hasData             = computed(() => summary.hasData.value)
const isFilteredEmpty     = computed(() => summary.isFilteredEmpty.value)
const hasSelection        = computed(() => summary.hasSelection.value)
const categories          = computed(() => summary.availableCategories.value)
const selectedCategories  = computed(() => summary.selectedCategories.value)
const selectedLabels      = computed(() =>
  categories.value.filter(c => selectedCategories.value.includes(c.key)).map(c => c.label)
)
const chartMode           = computed(() => summary.chartMode.value)
const loading             = computed(() => summary.loading.value)
const errorMessage        = computed(() => summary.error.value?.message ?? null)

const incomesTotal        = computed(() => summary.incomesTotal.value)
const expensesTotal       = computed(() => summary.expensesTotal.value)
const balance             = computed(() => summary.balance.value)

const showIncomeCard      = computed(() => config.value.showIncomeCard)
const showExpenseCard     = computed(() => config.value.showExpenseCard)
const showBalanceCard     = computed(() => config.value.showBalanceCard)

// The panel no longer renders action buttons for add income/expense, so
// remove the action-specific computed flags and icons. Keep the grid icon
// used by the categories control above.
const gridIcon = gridOutline
function categoryIcon(key){ return iconForCategory(key) }

const router = useRouter()
function openAddIncome(){ router.push({ name: 'AddIncome' }) }
function openAddExpense(){ router.push({ name: 'AddExpense' }) }

/* Expose panel-specific action flags so the template can show the
  appropriate 'Crear ingreso' / 'Crear gasto' buttons when the component
  is used as an income-only or expense-only panel. */
const showIncomeAction = computed(() => config.value.showIncomeAction)
const showExpenseAction = computed(() => config.value.showExpenseAction)

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

const categoriesLabel = computed(() =>
  hasSelection.value ? `Categorías: ${selectedLabels.value.length}` : 'Categorías: Todas'
)

function onModeChange(e){ summary.setChartMode(e.detail?.checked ? 'bar' : 'pie') }
function setActiveKey(key){ activeKey.value = key }
function toggleCategory(key){ summary.toggleCategory(key) }
function clearFilters(){ summary.clearCategories() }
function applyCats(){ openCats.value = false }
const formatCurrency = v => summary.formatCurrency(v)

watch(chartItems, (items) => {
  if (!items.length) { activeKey.value = null; return }
  if (!activeKey.value || !items.some(it => it.key === activeKey.value)) activeKey.value = items[0].key
})

const handleTransactionsChanged = () => { summary.load() }
const handleGoalsChanged = () => { summary.load() }

onMounted(() => {
  summary.load()
  window.addEventListener('data:transactions-changed', handleTransactionsChanged)
  window.addEventListener('data:goals-changed', handleGoalsChanged)
})

onUnmounted(() => {
  window.removeEventListener('data:transactions-changed', handleTransactionsChanged)
  window.removeEventListener('data:goals-changed', handleGoalsChanged)
})
</script>
