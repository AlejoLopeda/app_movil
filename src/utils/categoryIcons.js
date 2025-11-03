import {
  airplaneOutline,
  briefcaseOutline,
  carOutline,
  cartOutline,
  cashOutline,
  filmOutline,
  giftOutline,
  helpCircleOutline,
  homeOutline,
  medkitOutline,
  pawOutline,
  peopleOutline,
  refreshOutline,
  restaurantOutline,
  schoolOutline,
  shirtOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons'

const CATEGORY_ICON_MAP = {
  // Ingresos
  salario: cashOutline,
  regalos: giftOutline,
  pension: peopleOutline,
  comisiones: briefcaseOutline,
  propinas: restaurantOutline,
  reembolsos: refreshOutline,
  ventas: cartOutline,
  mesada: walletOutline,
  saldo_inicial: trendingUpOutline,

  // Gastos
  transporte: carOutline,
  hogar: homeOutline,
  comida: restaurantOutline,
  educacion: schoolOutline,
  entretenimiento: filmOutline,
  ropa: shirtOutline,
  viajes: airplaneOutline,
  mascotas: pawOutline,
  salud: medkitOutline,
  otros: cashOutline,

  // Fallback / sin categoría explícita
  '__sin-categoria-ingreso': helpCircleOutline,
  '__sin-categoria-gasto': helpCircleOutline,
  'sin categoria': helpCircleOutline,
  'sin_categoria': helpCircleOutline,
  'sin-categoria': helpCircleOutline,
}

const FALLBACK_ICON = cashOutline

export function iconForCategory(key) {
  if (!key) return helpCircleOutline
  const normalized = String(key).trim().toLowerCase()
  return CATEGORY_ICON_MAP[normalized] ?? FALLBACK_ICON
}

