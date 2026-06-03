<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { computed } from 'vue'

import type { AddonBanner } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'
import { useSignatures } from '@/composables/signatures/useSignatures'
import { normalizeUrl } from '@/utils'

interface Props {
  tdStyle?: HTMLAttributes['style']
  enableAnalytics?: boolean
}
defineProps<Props>()

const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin
const DEFAULT_BANNER_IMAGE = `${publicBase}/assets/acadenice-banniere.png`
const { getBannerEffective } = useSignatures()

const banner = computed<AddonBanner>(() => getBannerEffective())
const bannerSrc = computed(() =>
  banner.value.image?.trim() ? banner.value.image.trim() : DEFAULT_BANNER_IMAGE,
)

const imgKey = computed(() => bannerSrc.value)
</script>

<template>
  <Base.Table width="auto">
    <tr>
      <td
        valign="top"
        :style="[{ paddingTop: '5px' }, tdStyle]"
        style="padding: 0; margin: 0; padding-top: 5px"
      >
        <a
          :href="normalizeUrl(banner.link)"
          target="_blank"
          rel="noopener noreferrer"
          style="text-decoration: none"
        >
          <img
            :key="imgKey"
            :src="bannerSrc"
            alt="banner"
            style="
              display: block;
              height: auto;
              max-width: 100%;
              border: 0;
              outline: none;
              text-decoration: none;
            "
          >
        </a>
      </td>
    </tr>
  </Base.Table>
</template>
