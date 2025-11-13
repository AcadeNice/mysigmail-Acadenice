<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { AvatarShape } from '@/composables/signatures/types'

import { useImageVersion } from '@/composables/useImageVersion'

import * as Base from '../base'

interface Props {
  show?: boolean
  src?: string // "john_doe.png" ИЛИ полный URL
  size?: number
  shape?: AvatarShape
  tdStyle?: HTMLAttributes['style']
}
const props = defineProps<Props>()

const { installed } = useSignatures()
const { imageVersion } = useImageVersion()

const roundness = computed(() => {
  if (props.shape === 'round') return 100
  if (props.shape === 'rounded-corner') return 5
  return 0
})

const placeholder = computed(() => {
  const t = installed.value?.name
  return t && ['SignatureTemplate6', 'SignatureTemplate7'].includes(t)
    ? '/assets/avatar-2.png'
    : '/assets/avatar.png'
})

const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin

const resolvedSrc = computed(() => {
  const s = props.src?.trim()
  if (!s) return ''
  // Полный URL: оставляем домен, только добавим ?v= для cache-bust
  if (/^https?:\/\//i.test(s)) {
    return `${s}${s.includes('?') ? '&' : '?'}v=${imageVersion.value || 0}`
  }
  // Имя файла из нашего сервера -> всегда публичная статика
  return `${publicBase}/uploads/${s}?v=${imageVersion.value || 0}`
})
</script>

<template>
  <Base.Table width="auto">
    <tr>
      <td :style="tdStyle">
        <img
          :width="size"
          :src="resolvedSrc || placeholder"
          :style="{
            'max-width': `${size}px`,
            'width': `${size}px`,
            'border-radius': `${roundness}px`,
            'display': 'block',
          }"
          border="0"
          alt="avatar"
        >
      </td>
    </tr>
  </Base.Table>
</template>
