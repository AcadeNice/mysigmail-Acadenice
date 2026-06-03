<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue'

import type { BasicTool } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'

import { getAnchorAttrs, getFieldDisplayValue } from '../utils'

interface Props {
  model: BasicTool
  enableAnalytics?: boolean
  font?: Record<string, any>
  textColor?: string
  analyticTag?: string
}

const props = withDefaults(defineProps<Props>(), {
  textColor: '#010101',
})

const { options } = useSignatures()
const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin
const calendarIcon = `${publicBase}/assets/icons/calendar.png`

const anchorAttrs = computed<AnchorHTMLAttributes>(() => {
  const base = (getAnchorAttrs(props.model, props.textColor) ?? {}) as AnchorHTMLAttributes
  return {
    ...base,
    ...(props.enableAnalytics && props.analyticTag ? { 'data-analytic': props.analyticTag } : {}),
  }
})

const label = computed(() => getFieldDisplayValue(props.model))
const mainColor = computed(() => options.value?.mainColor || '#4CCCB8')
const secondaryColor = computed(() => options.value?.secondaryColor || '#FDA100')
const fontFamily = computed(() => props.font?.fontFamily || 'Arial, Helvetica, sans-serif')
const fontSize = computed(() => props.font?.fontSize || '12px')
</script>

<template>
  <Base.Link v-bind="anchorAttrs">
    <span
      style="
        display: inline-block;
        font-size: 0;
        line-height: 0;
        vertical-align: middle;
        white-space: nowrap;
      "
    >
      <span
        style="
          display: inline-block;
          width: 24px;
          height: 24px;
          line-height: 0;
          vertical-align: middle;
          border-radius: 3px 0 0 3px;
        "
        :style="{ backgroundColor: mainColor }"
      >
        <img
          :src="calendarIcon"
          width="20"
          height="20"
          alt="Calendrier"
          style="
            display: block;
            width: 20px;
            height: 20px;
            margin: 2px;
            border: 0;
            outline: none;
            text-decoration: none;
          "
        >
      </span>
      <span
        style="
          display: inline-block;
          height: 24px;
          padding: 0 9px;
          color: #ffffff;
          font-weight: 600;
          line-height: 24px;
          vertical-align: middle;
          border-radius: 0 3px 3px 0;
        "
        :style="{
          backgroundColor: secondaryColor,
          fontFamily,
          fontSize,
        }"
      >{{ label }}</span>
    </span>
  </Base.Link>
</template>
