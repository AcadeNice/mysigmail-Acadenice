<script setup lang="ts">
import { computed } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'

const { getBannerEffective, patchBannerEffective } = useSignatures()

const isHttp = (v: string) => /^https?:\/\/\S+/i.test(v.trim())

const image = computed<string>({
  get: () => getBannerEffective().image,
  set: (value) => {
    const raw = (value ?? '').trim()
    const next = !raw ? '' : isHttp(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`
    patchBannerEffective('image', next)
  },
})

const link = computed<string>({
  get: () => getBannerEffective().link,
  set: (v) => patchBannerEffective('link', (v ?? '').trim()),
})
</script>

<template>
  <UiFieldForm>
    <UiFieldFormItem
      label="Image URL"
      description="Collez un lien public vers l’image. Laissez vide pour utiliser la bannière AcadéNice par défaut."
    >
      <UiInput
        v-model="image"
        placeholder="https://sign.acadenice.com/assets/acadenice-banniere.png"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
      />
      <p class="mt-1 text-[12px] text-muted-foreground">
        Formats courants (PNG/JPG/GIF). Les liens Google Drive/SharePoint privés peuvent ne pas
        s’afficher.
      </p>
    </UiFieldFormItem>

    <UiFieldFormItem label="Link">
      <UiInput
        v-model="link"
        placeholder="https://acadenice.fr"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
