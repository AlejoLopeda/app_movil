<template>
  <div class="amount-group">
    <div class="amount-row">
      <div class="amount-coin">
        <ion-icon :icon="cashOutline" />
      </div>

      <ion-item class="amount-item" :class="{ 'is-invalid': showError }" lines="none">
        <ion-input
          class="amount-input"
          prefix="$"
          placeholder="................"
          inputmode="decimal"
          type="text"
          :value="value"
          @ionFocus="emit('dirty')"
          @ionInput="onInput"
          @ionBlur="emit('blur')"
        />
      </ion-item>
    </div>

    <div class="amount-hint-slot">
      <ion-note v-show="showError" color="danger" class="amount-hint">
        {{ errorMsg }}
      </ion-note>
    </div>
  </div>
</template>

<script setup>
import { IonItem, IonInput, IonIcon, IonNote } from '@ionic/vue'
import { cashOutline } from 'ionicons/icons'

const props = defineProps({
  value: { type: String, default: '' },
  showError: { type: Boolean, default: false },
  errorMsg: { type: String, default: '' },
})
const emit = defineEmits(['update:value', 'blur', 'dirty'])

function onInput(ev) {
  const v = ev?.detail?.value ?? ''  
  emit('update:value', v)
  emit('dirty')                       
}
</script>

<style src="../theme/initialAmount.css"></style>
