// src/composables/useOrigins.ts
import { computed } from 'vue'

function normalize(u: string) {
  return u.replace(/\/+$/, '')
}

export function useOrigins() {
  const publicOrigin
    = (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined)?.trim()
      || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

  let api = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim()
  if (!api) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
    api = origin.replace(':5173', ':3001')
  }

  return {
    publicOrigin: computed(() => normalize(publicOrigin)),
    apiOrigin: computed(() => normalize(api!)),
    isDev: computed(() => import.meta.env.DEV === true),
  }
}
