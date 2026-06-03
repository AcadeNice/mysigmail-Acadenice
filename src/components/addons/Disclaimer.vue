<script setup lang="ts">
import type { AddonDisclaimer } from '@/composables/signatures/types'

import { disclaimerPresets } from '@/data/disclaimer-pressets'

const { getAddonValue, patchAddonValue } = useSignatures()

const selectedPreset = ref('')

const disclaimer = computed(() => getAddonValue<AddonDisclaimer>('disclaimer'))

const text = computed({
  get: () => disclaimer.value.text,
  set: (value) => {
    patchAddonValue<AddonDisclaimer>('disclaimer', 'text', value)
  },
})

const fontSize = computed({
  get: () => [disclaimer.value.fontSize ?? 12],
  set: (value) => {
    patchAddonValue<AddonDisclaimer>('disclaimer', 'fontSize', value[0])
  },
})

const fullWidth = computed({
  get: () => disclaimer.value.fullWidth ?? false,
  set: (value) => {
    patchAddonValue<AddonDisclaimer>('disclaimer', 'fullWidth', value)
  },
})

watch(selectedPreset, (v) => (v ? (text.value = v) : null))
</script>

<template>
  <div class="space-y-3">
    <UiSelect v-model="selectedPreset">
      <UiSelectTrigger>
        <UiSelectValue placeholder="Sélectionner un modèle" />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem
          v-for="preset in disclaimerPresets"
          :key="preset.value"
          :value="preset.value"
        >
          {{ preset.label }}
        </UiSelectItem>
      </UiSelectContent>
    </UiSelect>
    <UiTextarea
      v-model="text"
      @update:model-value="selectedPreset = ''"
    />
    <p class="desc">
      Écrivez votre texte de disclaimer ou sélectionnez un modèle.
    </p>
    <UiFieldForm>
      <UiFieldFormItem
        label="Taille du texte"
        :description="`Taille du texte. Actuel : ${fontSize[0]}px`"
      >
        <div class="flex items-center h-5">
          <UiSlider
            v-model="fontSize"
            :min="8"
            :max="16"
          />
        </div>
      </UiFieldFormItem>
      <UiFieldFormItem label="Largeur">
        <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            v-model="fullWidth"
            type="checkbox"
            class="size-4 rounded border border-input accent-primary"
          >
          <span>Largeur complète</span>
        </label>
      </UiFieldFormItem>
    </UiFieldForm>
  </div>
</template>
