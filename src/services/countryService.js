// src/services/countryService.js
/**
 * Obtiene lista de países en español y la cachea en localStorage.
 * Fallback offline incluido por si la red falla.
 */
const LS_KEY = 'countriesES.v1';
const API_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2';

const FALLBACK_ES = [
  'Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba','Ecuador',
  'El Salvador','España','Guatemala','Honduras','México','Nicaragua','Panamá',
  'Paraguay','Perú','Puerto Rico','República Dominicana','Uruguay','Venezuela'
];

export async function fetchCountriesES () {
  const res = await fetch(API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('REST Countries no disponible');
  const data = await res.json();

  // Preferimos nombre en español si existe; si no, usamos el común
  const list = data
    .map(c =>
      c?.name?.nativeName?.spa?.common ||
      c?.name?.common ||
      null
    )
    .filter(Boolean)
    .map(name => name.trim())
    // normalizamos capitalización: primera mayúscula, resto como viene
    .map(n => n.charAt(0).toUpperCase() + n.slice(1))
    .sort((a,b) => a.localeCompare(b, 'es'));

  return Array.from(new Set(list)); // sin duplicados
}

export async function getCountriesES () {
  // 1) memoria del tab (evita toques múltiples durante una sesión)
  if (getCountriesES._mem) return getCountriesES._mem;

  // 2) cache disco
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    const list = JSON.parse(cached);
    getCountriesES._mem = list;
    return list;
  }

  // 3) red
  try {
    const list = await fetchCountriesES();
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    getCountriesES._mem = list;
    return list;
  } catch {
    // 4) fallback offline mínimo (mejor que nada)
    getCountriesES._mem = FALLBACK_ES;
    return FALLBACK_ES;
  }
}
