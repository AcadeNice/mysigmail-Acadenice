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

const DEFAULT_BANNER_IMAGE = ''
const { getBannerEffective } = useSignatures()

const banner = computed<AddonBanner>(() => getBannerEffective())
const bannerSrc = computed(() =>
  banner.value.image?.trim() ? banner.value.image.trim() : DEFAULT_BANNER_IMAGE,
)

// ключ для форс-перерисовки при смене URL/ширины
const imgKey = computed(() => `${bannerSrc.value}|${banner.value.width ?? 100}`)
</script>

<template>
  <!-- Табличная обёртка под e-mail, базовая ширина 600 -->
  <Base.Table width="600">
    <tr>
      <td
        valign="top"
        :style="[{ paddingTop: '5px' }, tdStyle]"
        style="padding: 0; margin: 0; padding-top: 5px"
      >
        <a
          :href="normalizeUrl(banner.link)"
          target="_blank"
          style="text-decoration: none"
        >
          <!--  Width -->
          <div
            :style="{
              maxWidth: '600px',
              width: `${banner.width ?? 35}%`,
            }"
          >
            <img
              :key="imgKey"
              :src="bannerSrc"
              alt="banner"
              width="600"
              style="
                display: block;
                width: 100%;
                height: auto;
                max-height: 150px;
                border: 0;
                outline: none;
                text-decoration: none;
              "
            >
          </div>
        </a>
      </td>
    </tr>
  </Base.Table>
</template>
