/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function makeGuardedProxy() {
  const message =
    '[Supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Configure them in .env.local and restart dev server.'
  const thrower = () => {
    try { console.error(message) } catch {}
    throw new Error(message)
  }
  const handler: ProxyHandler<any> = {
    get() {
      return new Proxy(thrower, handler)
    },
    apply() {
      return thrower()
    },
  }
  return new Proxy({}, handler) as any
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : makeGuardedProxy()
