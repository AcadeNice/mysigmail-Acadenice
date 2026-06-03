<script setup lang="ts">
import { computed } from 'vue'

import type { AddonTrackingPixel } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'
import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'

const { isUser } = useAccess()
const { getAddonValue } = useSignatures()

const pixel = computed<AddonTrackingPixel>(
  () =>
    getAddonValue<AddonTrackingPixel>('trackingPixel') ?? {
      url: '',
      enabled: false,
      recipient: '',
    },
)

const show = computed(() => isUser.value && pixel.value.enabled && pixel.value.url.trim())

// финальный URL — добавим rcpt= если указан recipient
const finalUrl = computed(() => {
  try {
    const base = pixel.value.url.trim()
    if (!base) return ''
    // корректно соберём query
    const u = new URL(
      base,
      typeof window !== 'undefined' ? window.location.origin : 'https://sign.acadenice.com',
    )
    const rcpt = (pixel.value.recipient || '').trim()
    if (rcpt) u.searchParams.set('rcpt', rcpt)
    return u.toString()
  } catch {
    return pixel.value.url.trim()
  }
})
</script>

<template>
  <template v-if="show">
    <Base.Table width="0">
      <tr>
        <td style="padding: 0; margin: 0; line-height: 0">
          <img
            :src="finalUrl"
            alt=""
            width="1"
            height="1"
            style="
              display: block;
              width: 1px !important;
              height: 1px !important;
              border: 0 !important;
              outline: none !important;
              text-decoration: none !important;
              opacity: 0 !important;
              overflow: hidden !important;
            "
            border="0"
          >
        </td>
      </tr>
    </Base.Table>
  </template>
</template>
