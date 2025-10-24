<template>
  <div class="goal-progress">
    <div class="goal-progress__track">
      <div
        class="goal-progress__bar"
        :class="{ 'is-complete': complete }"
        :style="{ width: pct + '%'}"
      />
    </div>
    <div class="goal-progress__label">
      <slot />
    </div>
  </div>
  
</template>

<script setup>
import '@/theme/goals.css'

const props = defineProps({
  pct: { type: Number, default: 0 },
  complete: { type: Boolean, default: false }
})
</script>
