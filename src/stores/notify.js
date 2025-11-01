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

// Banner state for custom in-app notification
let bannerTimer = null

export const banner = reactive({
  open: false,
  title: '',
  body: '',
  color: 'tertiary',
})

export function showBanner({ title, body = '', color = 'tertiary' } = {}) {
  banner.title = title || ''
  banner.body = body || ''
  banner.color = color || 'tertiary'
  banner.open = true
  if (bannerTimer) clearTimeout(bannerTimer)
  bannerTimer = setTimeout(() => hideBanner(), 5000)
}

export function hideBanner() {
  banner.open = false
  if (bannerTimer) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }
}