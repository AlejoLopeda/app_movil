import { reactive } from 'vue'

// Global, lightweight notification store for in-app toasts/banners
export const notification = reactive({
  open: false,
  message: '',
  color: 'primary',
})

export function showToast(message, color = 'primary') {
  notification.message = message || ''
  notification.color = color || 'primary'
  notification.open = true
}

