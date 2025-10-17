<template>
  <div class="monthly-chart">
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
              backgroundColor: item.color
            }"
          />
        </div>
        <span class="monthly-chart__bar-value">
          {{ formatter(item.amount) }}
        </span>
      </button>
    </div>

    <ul class="monthly-chart__legend">
      <li v-for="item in items" :key="`legend-${item.key}`">
        <button
          type="button"
          class="monthly-chart__legend-item"
          :class="{ active: item.key === activeKey }"
          @click="select(item.key)"
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
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(13, 63, 72, 0.08);
  color: inherit;
  text-align: left;
  transition: background 0.2s ease, box-shadow 0.2s ease;
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
  background: rgba(13, 63, 72, 0.12);
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
}

.monthly-chart__bar.active {
  background: rgba(13, 63, 72, 0.16);
  box-shadow: 0 6px 14px rgba(13, 63, 72, 0.18);
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
  border-radius: 12px;
  background: rgba(13, 63, 72, 0.04);
  color: inherit;
  text-align: left;
  transition: background 0.2s ease;
}

.monthly-chart__legend-item.active {
  background: rgba(13, 63, 72, 0.16);
}

.monthly-chart__legend-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}

.monthly-chart__legend-text {
  font-weight: 600;
}

.monthly-chart__legend-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(13, 63, 72, 0.72);
}

@media (prefers-color-scheme: dark) {
  .monthly-chart__pie {
    box-shadow: 0 4px 18px rgba(4, 23, 26, 0.45);
  }

  .monthly-chart__pie--empty {
    background: radial-gradient(circle at center, #1a2a2f, #0f1a1d);
    box-shadow: inset 0 0 0 2px rgba(190, 220, 224, 0.06);
  }

  .monthly-chart__bar {
    background: rgba(224, 242, 249, 0.1);
  }

  .monthly-chart__bar-track {
    background: rgba(224, 242, 249, 0.18);
  }

  .monthly-chart__legend-item {
    background: rgba(224, 242, 249, 0.08);
  }

  .monthly-chart__legend-value {
    color: rgba(224, 242, 249, 0.72);
  }
}
</style>
