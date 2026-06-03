import type { AnchorHTMLAttributes } from 'vue'

import type { BasicTool } from '@/composables/signatures/types'

import { normalizeUrl } from '@/utils'

export function getAnchorAttrs(
  tool: BasicTool,
  textColor: string,
): AnchorHTMLAttributes | undefined {
  if (tool.type === 'link') {
    return {
      href: normalizeUrl(tool.value),
      style: {
        color: textColor,
      },
    }
  }

  if (tool.type === 'email') {
    return {
      href: `mailto:${tool.value}`,
      style: {
        color: textColor,
      },
    }
  }

  if (tool.type === 'phone') {
    return {
      href: `tel:${tool.value}`,
      style: {
        color: textColor,
      },
    }
  }
}

export function usesLabelAsLinkText(tool: BasicTool) {
  return tool.type === 'link'
}

export function getFieldDisplayValue(tool: BasicTool) {
  if (usesLabelAsLinkText(tool)) {
    return tool.label
  }

  return tool.value
}
