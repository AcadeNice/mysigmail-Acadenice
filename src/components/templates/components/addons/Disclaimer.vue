<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { AddonDisclaimer } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'

interface Props {
  tdStyle?: HTMLAttributes['style']
}

defineProps<Props>()

const { getAddonValue, options } = useSignatures()

const disclaimer = computed(() => {
  const value = getAddonValue<AddonDisclaimer | string>('disclaimer')
  if (typeof value === 'string') {
    return {
      text: value,
      fontSize: options.value?.fontSize ?? 12,
    }
  }

  return {
    text: value?.text ?? '',
    fontSize: value?.fontSize ?? options.value?.fontSize ?? 12,
  }
})

const displayText = computed(() => disclaimer.value.text.replace(/\s*\n\s*/g, ' ').trim())

const computedStyle = computed(() => {
  const style: HTMLAttributes['style'] = {
    color: '#888',
    fontSize: `${disclaimer.value.fontSize}px`,
    lineHeight: `${Math.round(disclaimer.value.fontSize * 1.45)}px`,
    margin: '0',
  }

  if (options.value) {
    style.fontFamily = options.value.fontFamily
  }

  return style
})
</script>

<template>
  <Base.Table width="auto">
    <tr>
      <td :style="tdStyle">
        <div :style="computedStyle">
          {{ displayText }}
        </div>
      </td>
    </tr>
  </Base.Table>
</template>
