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

function normalizeLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
}

const defaultHiddenLabels = new Set([
  'nom complet',
  'intitule du poste',
  'entreprise',
])

export function shouldShowFieldLabel(tool: BasicTool, showLabel: boolean) {
  if (!tool.label || usesLabelAsLinkText(tool)) return false
  if (showLabel) return true

  return tool.type === 'text' && !defaultHiddenLabels.has(normalizeLabel(tool.label))
}

export function getFieldDisplayValue(tool: BasicTool) {
  if (usesLabelAsLinkText(tool)) {
    return tool.label || tool.value
  }

  return tool.value
}
