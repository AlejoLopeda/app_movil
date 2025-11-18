<template>
  <div :class="['monthly-chart', themeClass]">
    <div v-if="mode === 'pie'" class="monthly-chart__pie-wrapper">
      <div
        class="monthly-chart__pie"
        :class="{ 'monthly-chart__pie--empty': items.length === 0 }"
        :style="pieStyle"
      />
    </div>

    <div v-else class="monthly-chart__bars">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="monthly-chart__bar"
        :class="{ active: item.key === activeKey }"
        :style="{ '--chart-accent': barColor(item) }"
        @click="select(item.key)"
      >
        <span class="monthly-chart__bar-label">
          {{ item.label }}
        </span>
        <div class="monthly-chart__bar-track">
          <div
            class="monthly-chart__bar-fill"
            :style="{
              width: barWidth(item),
              backgroundColor: barColor(item)
            }"
          />
        </div>
        <span class="monthly-chart__bar-value">
          {{ formatter(item.amount) }}
        </span>
      </button>
    </div>

    <!-- Legend: keep mounted but hide on bars to preserve interactivity/state -->
    <ul v-show="mode === 'pie'" class="monthly-chart__legend">
      <li v-for="item in items" :key="`legend-${item.key}`">
        <button
          type="button"
          class="monthly-chart__legend-item"
          :class="{ active: item.key === activeKey }"
          @click="select(item.key)"
          :style="{ '--legend-border': item.color }"
        >
          <span
            class="monthly-chart__legend-color"
            :style="{ backgroundColor: item.color }"
          />
          <span class="monthly-chart__legend-text">
            {{ item.label }}
          </span>
          <span class="monthly-chart__legend-value">
            {{ formatter(item.amount) }} · {{ item.percentage.toFixed(1) }}%
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'pie' },
  items: { type: Array, default: () => [] },
  activeKey: { type: String, default: null },
  theme: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'income', 'expense'].includes(v),
  },
  formatter: {
    type: Function,
    default: (value) => new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value || 0))
  }
})

const emit = defineEmits(['select'])

const THEME_ACCENTS = Object.freeze({
  income: '#2a9d8f',
  expense: '#d1495b',
})

const themeClass = computed(() => {
  if (!props.theme || props.theme === 'default') return null
  return `monthly-chart--${props.theme}`
})

const themeAccent = computed(() => THEME_ACCENTS[props.theme] || null)

const pieStyle = computed(() => {
  if (!props.items.length) {
    return { background: 'conic-gradient(#d7e1e6 0deg, #d7e1e6 360deg)' }
  }
  let start = 0
  const segments = props.items.map((item) => {
    const sweep = (item.percentage / 100) * 360
    const end = start + sweep
    const segment = `${item.color} ${start}deg ${end}deg`
    start = end
    return segment
  })
  return { background: `conic-gradient(${segments.join(', ')})` }
})

const maxAmount = computed(() => {
  if (!props.items.length) return 0
  return props.items.reduce((max, item) => Math.max(max, item.amount), 0)
})

function barColor(item) {
  if (themeAccent.value) return themeAccent.value
  return item?.color || '#0d3f48'
}

function barWidth(item) {
  if (!maxAmount.value) return '0%'
  const width = (item.amount / maxAmount.value) * 100
  return `${Math.max(4, Math.min(width, 100))}%`
}

function select(key) {
  emit('select', key)
}
</script>

<style scoped>
.monthly-chart {
  display: grid;
  gap: 18px;
  --chart-border: rgba(13, 63, 72, 0.1);
  --chart-bg: linear-gradient(180deg, #ffffff, #f7fbfc);
  --chart-shadow: 0 18px 32px -28px rgba(13, 63, 72, 0.4);
  --chart-track: rgba(13, 63, 72, 0.08);
  --chart-value: rgba(13, 63, 72, 0.72);
  --chart-active-bg: #f1f7f9;
}

.monthly-chart--income {
  --chart-border: rgba(42, 157, 143, 0.35);
  --chart-shadow: 0 20px 36px -30px rgba(42, 157, 143, 0.4);
  --chart-track: rgba(42, 157, 143, 0.18);
  --chart-active-bg: rgba(42, 157, 143, 0.08);
}

.monthly-chart--expense {
  --chart-border: rgba(209, 73, 91, 0.35);
  --chart-shadow: 0 20px 36px -30px rgba(209, 73, 91, 0.35);
  --chart-track: rgba(209, 73, 91, 0.2);
  --chart-active-bg: rgba(209, 73, 91, 0.08);
  --chart-value: rgba(96, 20, 30, 0.86);
}

.monthly-chart__pie-wrapper {
  display: grid;
  place-items: center;
  padding: 12px 0;
}

.monthly-chart__pie {
  width: min(260px, 68vw);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  box-shadow: 0 4px 18px rgba(11, 53, 59, 0.18);
  transition: transform 0.25s ease;
}

.monthly-chart__pie--empty {
  background: radial-gradient(circle at center, #f0f4f5, #dbe4e8);
  box-shadow: inset 0 0 0 2px rgba(13, 63, 72, 0.08);
}

.monthly-chart__bars {
  display: grid;
  gap: 12px;
}

.monthly-chart__bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--chart-border);
  background: var(--chart-bg);
  color: #0b2c33;
  box-shadow: var(--chart-shadow);
  text-align: left;
  transition: background 0.2s ease, box-shadow 0.2s ease,
    transform 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.monthly-chart__bar:hover,
.monthly-chart__bar:focus-visible {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 20px 36px -24px rgba(13, 63, 72, 0.6);
}

.monthly-chart__bar-label {
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: capitalize;
}

.monthly-chart__bar-track {
  grid-column: 1 / -1;
  height: 8px;
  border-radius: 999px;
  background: var(--chart-track);
  overflow: hidden;
}

.monthly-chart__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.monthly-chart__bar-value {
  justify-self: end;
  font-weight: 600;
  color: var(--chart-value);
}

.monthly-chart__bar.active {
  background: var(--chart-active-bg);
  border-color: var(--chart-accent, var(--chart-border));
  color: #0b2c33;
  box-shadow: 0 26px 42px -30px rgba(13, 63, 72, 0.5);
  transform: translateY(-2px);
}

.monthly-chart__bar.active .monthly-chart__bar-value {
  color: #0b2c33;
}

.monthly-chart__bar.active .monthly-chart__bar-track {
  background: var(--chart-track);
}

.monthly-chart__legend {
  list-style: none;
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
}

.monthly-chart__legend-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 2px solid var(--legend-border, rgba(13, 63, 72, 0.24));
  background: rgba(255, 255, 255, 0.92);
  color: #0b2c33;
  box-shadow: 0 10px 26px -22px rgba(13, 63, 72, 0.55);
  text-align: left;
  transition: background 0.2s ease, transform 0.2s ease,
    box-shadow 0.2s ease, color 0.2s ease;
}

.monthly-chart__legend-item:hover,
.monthly-chart__legend-item:focus-visible {
  background: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 16px 32px -24px rgba(13, 63, 72, 0.55);
}

.monthly-chart__legend-item.active {
  background: var(--monthly-accent, #0d3f48);
  color: var(--monthly-accent-contrast, #ffffff);
  box-shadow: 0 20px 36px -26px rgba(13, 63, 72, 0.7);
}

.monthly-chart__legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.monthly-chart__legend-text {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.monthly-chart__legend-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(13, 63, 72, 0.72);
}

.monthly-chart__legend-item.active .monthly-chart__legend-value {
  color: currentColor;
}

</style>
