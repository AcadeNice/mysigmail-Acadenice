// src/composables/useOrigins.ts
import { computed } from 'vue'

function normalize(u: string) {
  return u.replace(/\/+$/, '')
}

export function useOrigins() {
  const isDev = import.meta.env.DEV === true

  // base origin
  const browserOrigin
    = typeof window !== 'undefined' ? window.location.origin : 'https://sign.a3n.fr'

  // public origin
  const publicOriginRaw
    = (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined)?.trim() || browserOrigin
  const publicOrigin = normalize(publicOriginRaw)

  // API origin:
  // 1) VITE_API_ORIGIN — using it;
  // 2) (reverse proxy /api → Node).
  let apiOriginRaw = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim()

  if (!apiOriginRaw) {
    if (isDev) {
      apiOriginRaw = browserOrigin.replace(':5173', ':3001')
    } else {
      apiOriginRaw = publicOrigin
    }
  }

  const apiOrigin = normalize(apiOriginRaw)

  return {
    publicOrigin: computed(() => publicOrigin),
    apiOrigin: computed(() => apiOrigin),
    isDev: computed(() => isDev),
  }
}
