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
      Écrivez votre clause de confidentialité ou sélectionnez un modèle.
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
    </UiFieldForm>
  </div>
</template>
