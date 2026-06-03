<script setup lang="ts">
import type { AnchorHTMLAttributes, HTMLAttributes } from 'vue'

import { computed, defineProps, withDefaults } from 'vue'

import type { BasicTool } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'

import { getAnchorAttrs, getFieldDisplayValue, shouldShowFieldLabel } from '../utils'

interface Props {
  model: BasicTool
  type?: string
  enableAnalytics?: boolean
  tdStyle?: HTMLAttributes['style']
  display?: string
  showLabel?: boolean
  separator?: string
  font?: Record<string, any>
  labelColor?: string
  textColor?: string
  analyticTag?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'td',
  display: 'block',
  showLabel: true,
  textColor: '#010101',
})

/** Always return an object; never undefined */
const anchorAttrs = computed<AnchorHTMLAttributes>(() => {
  // if getAnchorAttrs can return undefined, coerce to {}
  const base = (getAnchorAttrs(props.model, props.textColor) ?? {}) as AnchorHTMLAttributes

  // conditionally add analytics attribute
  return {
    ...base,
    ...(props.enableAnalytics && props.analyticTag ? { 'data-analytic': props.analyticTag } : {}),
  }
})

const displayValue = computed(() => getFieldDisplayValue(props.model))
const showFieldLabel = computed(
  () => shouldShowFieldLabel(props.model, props.showLabel),
)
const { inlineFieldsFor } = useSignatures()
const inlineFields = computed(() => inlineFieldsFor(props.model))
</script>

<template>
  <tr>
    <td
      valign="top"
      :style="tdStyle"
      style="font-size: 0"
    >
      <p
        v-if="model.value"
        :style="{ ...font, display }"
      >
        <span
          v-if="showFieldLabel"
          style="padding-right: 0px; font-weight: 600"
          v-bind="$attrs"
          :style="{ color: labelColor }"
        >{{ model.label }}&nbsp;:&nbsp;&nbsp;</span>

        <Base.Link
          v-if="model.type !== 'text'"
          v-bind="anchorAttrs"
        >
          {{ displayValue }}
        </Base.Link>

        <span
          v-else
          :style="{ color: textColor }"
          v-bind="$attrs"
        >{{ model.value }}</span>

        <template
          v-for="inlineField in inlineFields"
          :key="inlineField.id"
        >
          <span style="padding: 0 0px">&nbsp;&nbsp;</span>
          <span
            v-if="shouldShowFieldLabel(inlineField, true)"
            style="padding-right: 0px; font-weight: 600"
            v-bind="$attrs"
            :style="{ color: labelColor }"
          >{{ inlineField.label }}&nbsp;:&nbsp;&nbsp;</span>
          <Base.Link
            v-if="inlineField.type !== 'text'"
            v-bind="getAnchorAttrs(inlineField, textColor)"
          >
            {{ getFieldDisplayValue(inlineField) }}
          </Base.Link>
          <span
            v-else
            :style="{ color: textColor }"
            v-bind="$attrs"
          >{{ inlineField.value }}</span>
        </template>
      </p>
    </td>
  </tr>
</template>
