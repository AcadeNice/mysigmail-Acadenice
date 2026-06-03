<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import type { BasicTool } from '@/composables/signatures/types'

import * as Base from '@/components/templates/components/base'

import { getAnchorAttrs, getFieldDisplayValue, shouldShowFieldLabel } from '../utils'

interface Props {
  model: BasicTool[]
  type?: string
  name?: string
  tdStyle?: HTMLAttributes['style']
  display?: string
  showLabel?: boolean
  separator?: string
  font?: object
  labelColor?: string
  textColor?: string
  separatorStyle?: HTMLAttributes['style']
}

withDefaults(defineProps<Props>(), {
  type: 'td',
  display: 'block',
  showLabel: true,
  textColor: '#000',
})

const { inlineFieldsFor } = useSignatures()
</script>

<template>
  <tr>
    <td
      valign="top"
      :style="tdStyle"
      style="font-size: 0"
    >
      <template v-if="separator !== 'br'">
        <p :style="{ ...font }">
          <span
            v-for="(i, index) in model"
            :key="index"
          >
            <span
              v-if="separator && separator !== 'br' && index > 0"
              style="padding: 0 0px"
              :style="separatorStyle"
            >&nbsp;&nbsp;{{ separator }}&nbsp;&nbsp;</span>
            <span
              v-if="shouldShowFieldLabel(i, showLabel)"
              style="padding-right: 0px; font-weight: 600"
              v-bind="$attrs"
              :style="{ color: labelColor }"
            >{{ i.label }}:&nbsp;&nbsp;</span>
            <Base.Link
              v-if="i.type !== 'text'"
              v-bind="getAnchorAttrs(i, textColor)"
            >
              {{ getFieldDisplayValue(i) }}
            </Base.Link>
            <span
              v-if="i.type === 'text'"
              :style="{ color: textColor }"
              v-bind="$attrs"
            >{{
              i.value
            }}</span>
            <template
              v-for="inlineField in inlineFieldsFor(i)"
              :key="inlineField.id"
            >
              <span style="padding: 0 0px">&nbsp;&nbsp;</span>
              <span
                v-if="shouldShowFieldLabel(inlineField, true)"
                style="padding-right: 0px; font-weight: 600"
                v-bind="$attrs"
                :style="{ color: labelColor }"
              >{{ inlineField.label }}:&nbsp;&nbsp;</span>
              <Base.Link
                v-if="inlineField.type !== 'text'"
                v-bind="getAnchorAttrs(inlineField, textColor)"
              >
                {{ getFieldDisplayValue(inlineField) }}
              </Base.Link>
              <span
                v-if="inlineField.type === 'text'"
                :style="{ color: textColor }"
                v-bind="$attrs"
              >{{ inlineField.value }}</span>
            </template>
          </span>
        </p>
      </template>
      <template v-if="separator === 'br'">
        <p
          v-for="(i, index) in model"
          :key="index"
          :style="{ ...font }"
        >
          <span
            v-if="shouldShowFieldLabel(i, showLabel)"
            style="padding-right: 0px; font-weight: 600"
            v-bind="$attrs"
            :style="{ color: labelColor }"
          >{{ i.label }}:&nbsp;&nbsp;</span>
          <Base.Link
            v-if="i.type !== 'text'"
            v-bind="getAnchorAttrs(i, textColor)"
          >
            {{ getFieldDisplayValue(i) }}
          </Base.Link>
          <span
            v-if="i.type === 'text'"
            :style="{ color: textColor }"
            v-bind="$attrs"
          >{{
            i.value
          }}</span>
          <template
            v-for="inlineField in inlineFieldsFor(i)"
            :key="inlineField.id"
          >
            <span style="padding: 0 0px">&nbsp;&nbsp;</span>
            <span
              v-if="shouldShowFieldLabel(inlineField, true)"
              style="padding-right: 0px; font-weight: 600"
              v-bind="$attrs"
              :style="{ color: labelColor }"
            >{{ inlineField.label }}:&nbsp;&nbsp;</span>
            <Base.Link
              v-if="inlineField.type !== 'text'"
              v-bind="getAnchorAttrs(inlineField, textColor)"
            >
              {{ getFieldDisplayValue(inlineField) }}
            </Base.Link>
            <span
              v-if="inlineField.type === 'text'"
              :style="{ color: textColor }"
              v-bind="$attrs"
            >{{ inlineField.value }}</span>
          </template>
        </p>
      </template>
    </td>
  </tr>
</template>

<style lang="scss"></style>
