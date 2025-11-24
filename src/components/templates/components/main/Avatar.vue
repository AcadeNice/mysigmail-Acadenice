<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { computed, ref, onMounted } from 'vue'

import type { AvatarShape } from '@/composables/signatures/types'

import { useImageVersion } from '@/composables/useImageVersion'

const props = defineProps<Props>()

// getting role
const isUser = ref(false)
async function fetchRole() {
  try {
    const res = await fetch('/api/auth/status', { credentials: 'include' })
    const data = await res.json()
    isUser.value = data?.role === 'user'
  } catch {
    isUser.value = false
  }
}
onMounted(fetchRole)

interface Props {
  show?: boolean
  src?: string // "john_doe.png" or full url
  size?: number
  shape?: AvatarShape
  tdStyle?: HTMLAttributes['style']
}

const { imageVersion } = useImageVersion()

const roundness = computed(() => {
  if (props.shape === 'round') return 100
  if (props.shape === 'rounded-corner') return 5
  return 0
})

const placeholder = computed(() => '/assets/avatar.png')

const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin
const isHttp = (s: string) => /^https?:\/\//i.test(s)

const resolvedSrc = computed(() => {
  const s = (props.src ?? '').trim()
  if (!s) return ''

  // showing to everyone if its url
  if (isHttp(s)) return `${s}${s.includes('?') ? '&' : '?'}v=${imageVersion.value || 0}`

  // local files ONLY to users
  if (!isUser.value) return '' // placeholder for guests

  return `${publicBase}/uploads/${s}?v=${imageVersion.value || 0}`
})
</script>

<template>
  <table width="auto">
    <tbody>
      <tr>
        <td :style="tdStyle">
          <img
            :width="size"
            :src="resolvedSrc || placeholder"
            :style="{
              maxWidth: `${size}px`,
              width: `${size}px`,
              borderRadius: `${roundness}px`,
              display: 'block',
            }"
            border="0"
            alt="avatar"
          >
        </td>
      </tr>
    </tbody>
  </table>
</template>
