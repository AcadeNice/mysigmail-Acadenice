<script setup lang="ts">
import type { AddonVideoConference } from '@/composables/signatures/types'

const { getAddonValue, patchAddonValue } = useSignatures()

const options = [
  { label: 'Google Meet', value: 'google-meet' },
  { label: 'Skype', value: 'skype' },
  { label: 'Zoom', value: 'zoom' },
]

const type = computed({
  get: () => getAddonValue<AddonVideoConference>('videoConference').type,
  set: (value) => {
    patchAddonValue<AddonVideoConference>('videoConference', 'type', value)
  },
})

const text = computed({
  get: () => getAddonValue<AddonVideoConference>('videoConference').text,
  set: (value) => {
    patchAddonValue<AddonVideoConference>('videoConference', 'text', value)
  },
})

const link = computed({
  get: () => getAddonValue<AddonVideoConference>('videoConference').link,
  set: (value) => {
    patchAddonValue<AddonVideoConference>('videoConference', 'link', value)
  },
})
</script>

<template>
  <UiFieldForm>
    <UiFieldFormItem label="Type">
      <UiSelect v-model="type">
        <UiSelectTrigger>
          <UiSelectValue placeholder="Sélectionner un type" />
        </UiSelectTrigger>
        <UiSelectContent>
          <UiSelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </UiSelectItem>
        </UiSelectContent>
      </UiSelect>
    </UiFieldFormItem>
    <UiFieldFormItem label="Texte">
      <UiInput v-model="text" />
    </UiFieldFormItem>
    <UiFieldFormItem label="Lien">
      <UiInput
        v-model="link"
        placeholder="https://"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
