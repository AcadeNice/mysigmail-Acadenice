import type { Component } from 'vue'

export interface Props {
  title: string
  description?: string
  component?: Component
  type?: 'default' | 'success' | 'error'
  closeButton?: boolean
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}
