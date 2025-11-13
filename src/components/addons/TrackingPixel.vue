<!-- src/components/addons/TrackingPixelEditor.vue -->
<script setup lang="ts">
/* UI en français; commentaires en anglais */
import { computed, onMounted } from 'vue'

import type { AddonTrackingPixel } from '@/composables/signatures/types'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
import { useOrigins } from '@/composables/useOrigins'

const { isUser } = useAccess()
const { getAddonValue, patchAddonValue } = useSignatures()
const { apiOrigin } = useOrigins()

// Reactive model from the signatures store (fallback defaults)
const pixel = computed<AddonTrackingPixel>(
  () =>
    getAddonValue<AddonTrackingPixel>('trackingPixel') ?? { url: '', enabled: true, recipient: '' },
)

// 2-way bindings (only write when user is authenticated)
const url = computed<string>({
  get: () => pixel.value.url,
  set: (v) => {
    if (isUser.value) patchAddonValue<AddonTrackingPixel>('trackingPixel', 'url', (v ?? '').trim())
  },
})
const recipient = computed<string>({
  get: () => pixel.value.recipient ?? '',
  set: (v) => {
    if (isUser.value)
      patchAddonValue<AddonTrackingPixel>('trackingPixel', 'recipient', (v ?? '').trim())
  },
})

// Build pixel URL using current origin and template params
function buildPixel(rec?: string) {
  const base = `${apiOrigin.value}/pixel.gif?sender={{email}}&sig={{signatureId}}&t={{timestamp}}`
  return rec?.trim() ? `${base}&rcpt=${encodeURIComponent(rec.trim())}` : base
}

// Generate button handler — sets URL and forces "enabled: true"
function generate() {
  if (!isUser.value) return
  url.value = buildPixel(recipient.value)
  // ensure enabled is true
  patchAddonValue<AddonTrackingPixel>('trackingPixel', 'enabled', true as any)
}

// Autofill on mount if URL is empty
onMounted(() => {
  if (isUser.value && !url.value) {
    url.value = buildPixel() // without rcpt
    patchAddonValue<AddonTrackingPixel>('trackingPixel', 'enabled', true as any)
  }
})
</script>

<template>
  <div v-if="isUser">
    <UiFieldForm>
      <UiFieldFormItem label="URL du pixel de suivi">
        <div class="flex gap-2">
          <UiInput
            v-model="url"
            class="flex-1"
            placeholder="https://votre-api.tld/pixel.gif?sender=...&sig=...&t=...&rcpt=..."
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
          />
          <UiButton
            type="button"
            @click="generate"
          >
            Générer
          </UiButton>
        </div>
        <p class="mt-1 text-[12px] text-muted-foreground">
          Le domaine est pris automatiquement de la configuration (<code>VITE_API_ORIGIN</code>) ou
          de <code>window.location.origin</code>.
        </p>
      </UiFieldFormItem>

      <UiFieldFormItem label="Destinataire (optionnel)">
        <div class="flex gap-2">
          <UiInput
            v-model="recipient"
            placeholder="ex : jean.dupont@example.com"
            class="flex-1"
          />
          <UiButton
            type="button"
            variant="secondary"
            @click="generate"
          >
            Générer
          </UiButton>
        </div>
      </UiFieldFormItem>

      <!-- Pas de switch “Activer” : le pixel est actif dès que l’addon est présent -->
      <div class="text-[12px] text-muted-foreground">
        Le suivi est <strong>actif</strong> pour cette signature tant que l’addon est installé.
      </div>
    </UiFieldForm>
  </div>

  <div
    v-else
    class="text-sm text-muted-foreground"
  >
    Disponible après connexion.
  </div>
</template>
