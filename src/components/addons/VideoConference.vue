<script setup lang="ts">
import type { AddonVideoConference, VideoConference } from '@/composables/signatures/types'

import { buildVideoConferenceUrl } from '@/utils'

const { getAddonValue, patchAddonValue } = useSignatures()

const options: Array<{ label: string, value: VideoConference }> = [
  { label: 'Google Meet', value: 'google-meet' },
  { label: 'Skype', value: 'skype' },
  { label: 'Zoom', value: 'zoom' },
]

const fieldOptions: Record<VideoConference, {
  description: string
  inputLabel: string
  link: string
  placeholder: string
  text: string
}> = {
  'google-meet': {
    text: 'Me rejoindre sur Google Meet',
    link: 'https://meet.google.com/calling/',
    inputLabel: 'Compte, téléphone ou lien Meet',
    placeholder: 'prenom@acadenice.fr ou abc-defg-hij',
    description: 'Google ne documente pas d’URL directe avec email. Si vous saisissez un contact, le bouton ouvre l’espace Appels Meet ; un lien Meet collé est conservé.',
  },
  hangouts: {
    text: 'Me rejoindre sur Google Meet',
    link: 'https://meet.google.com/calling/',
    inputLabel: 'Compte, téléphone ou lien Meet',
    placeholder: 'prenom@acadenice.fr ou abc-defg-hij',
    description: 'Hangouts est remplacé par Google Meet. Le bouton ouvre l’espace Appels Meet ou le lien Meet collé.',
  },
  skype: {
    text: 'M’appeler sur Skype',
    link: '',
    inputLabel: 'Identifiant Skype',
    placeholder: 'pseudo.skype',
    description: 'Saisissez un pseudo ou un numéro Skype. L’outil génère une URI d’appel vidéo Skype.',
  },
  zoom: {
    text: 'Me rejoindre sur Zoom',
    link: '',
    inputLabel: 'ID, lien personnel ou URL Zoom',
    placeholder: '1234567890 ou prenom.nom',
    description: 'Saisissez une URL Zoom, un ID de réunion ou un lien personnel. Un ID devient zoom.us/j/..., un alias devient zoom.us/my/....',
  },
}

const defaultTexts = new Set([
  ...Object.values(fieldOptions).map((option) => option.text),
  'Meet me on Google Hangouts',
])

const defaultLinks = new Set([
  ...Object.values(fieldOptions).map((option) => option.link),
  '',
  'https://meet.google.com/',
])

const type = computed({
  get: () => getAddonValue<AddonVideoConference>('videoConference').type,
  set: (value: VideoConference) => {
    const current = getAddonValue<AddonVideoConference>('videoConference')
    const next = fieldOptions[value]

    patchAddonValue<AddonVideoConference>('videoConference', 'type', value)

    if (!current.text || defaultTexts.has(current.text)) {
      patchAddonValue<AddonVideoConference>('videoConference', 'text', next.text)
    }

    if (!current.link || defaultLinks.has(current.link)) {
      patchAddonValue<AddonVideoConference>('videoConference', 'link', next.link)
    }
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

const currentFieldOption = computed(() => fieldOptions[type.value])
const linkPreview = computed(() => buildVideoConferenceUrl(type.value, link.value))
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
    <UiFieldFormItem
      :label="currentFieldOption.inputLabel"
      :description="currentFieldOption.description"
    >
      <UiInput
        v-model="link"
        :placeholder="currentFieldOption.placeholder"
      />
      <p
        v-if="linkPreview"
        class="mt-1 text-[12px] text-muted-foreground break-all"
      >
        Lien généré : {{ linkPreview }}
      </p>
    </UiFieldFormItem>
  </UiFieldForm>
</template>
