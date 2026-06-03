<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { AddonLogo } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'
import { normalizeUrl } from '@/utils'

interface Props {
  tdStyle?: HTMLAttributes['style']
  enableAnalytics?: boolean
}

defineProps<Props>()

const { getAddonValue, options } = useSignatures()

const logo = computed(() => getAddonValue<AddonLogo>('logo'))

// Absolute URL so the image resolves in mail clients (relative paths break in Gmail/Outlook)
const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin
const DEFAULT_LOGO_IMAGE = `${publicBase}/assets/logo-acadenice.png`

const avatarSize = computed(() => {
  return options.value?.avatarSize
})
</script>

<template>
  <Base.Table width="auto">
    <tr>
      <td
        valign="top"
        style="line-height: 0"
        :style="tdStyle"
      >
        <a
          :href="normalizeUrl(logo.link)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            :src="logo.image || DEFAULT_LOGO_IMAGE"
            alt="logo"
            :width="avatarSize"
          >
        </a>
      </td>
    </tr>
  </Base.Table>
</template>
