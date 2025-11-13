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

const widthPct = computed<number>({
  get: () => getBannerEffective().width ?? 100,
  set: (val) => {
    const v = Math.max(10, Math.min(100, Math.round(val ?? 100)))
    patchBannerEffective('width', v)
  },
})

const widthArr = computed<number[]>({
  get: () => [widthPct.value],
  set: (arr) => (widthPct.value = Array.isArray(arr) ? arr[0] : 100),
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
        placeholder="https://example.com/banner.png"
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

    <UiFieldFormItem
      label="Width"
      :description="`Largeur en pourcentage. Actuelle : ${widthPct}%`"
    >
      <div class="flex items-center h-5">
        <UiSlider
          v-model="widthArr"
          :min="10"
          :max="100"
        />
      </div>
    </UiFieldFormItem>
  </UiFieldForm>
</template>
