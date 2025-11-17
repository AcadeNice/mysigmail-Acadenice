<script setup lang="ts">
import { computed } from 'vue'

import type { AddonLogo } from '@/composables/signatures/types'

import { useSignatures } from '@/composables/signatures/useSignatures'

const { getAddonValue, patchAddonValue } = useSignatures()

// helper: нормализуем URL
function normalizeUrl(raw: string): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v.replace(/^\/+/, '')}`
}

const image = computed<string>({
  get: () => getAddonValue<AddonLogo>('logo')?.image ?? '',
  set: (val) => patchAddonValue<AddonLogo>('logo', 'image', normalizeUrl(val)),
})

const link = computed<string>({
  get: () => getAddonValue<AddonLogo>('logo')?.link ?? '',
  set: (val) => patchAddonValue<AddonLogo>('logo', 'link', normalizeUrl(val)),
})
</script>

<template>
  <UiFieldForm>
    <UiFieldFormItem
      label="Logo (URL uniquement)"
      description="Collez un lien public vers l’image du logo (PNG/JPG/SVG)."
    >
      <UiInput
        v-model="image"
        placeholder="https://example.com/logo.png"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
      />
      <p class="mt-1 text-[12px] text-muted-foreground">
        Astuce : si vous entrez seulement un nom de domaine, on ajoutera
        <code>https://</code> automatiquement.
      </p>
    </UiFieldFormItem>

    <UiFieldFormItem
      label="Lien du logo (optionnel)"
      description="Lien ouvert au clic sur le logo."
    >
      <UiInput
        v-model="link"
        placeholder="https://votre-site.fr"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
