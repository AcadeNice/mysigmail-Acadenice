<script setup lang="ts">
import { nanoid } from 'nanoid'

import { attributes } from '@/data/attributes'
import { clone } from '@/utils'

interface Props {
  index: number
  value: BasicTool
}

const props = defineProps<Props>()

const { installed } = useSignatures()

const localValue = ref(clone<BasicTool>(props.value))

function isSameTool(a: BasicTool, b: BasicTool) {
  return a.id === b.id
    && a.inlineWith === b.inlineWith
    && a.label === b.label
    && a.type === b.type
    && a.value === b.value
}

const defaultLabels: Record<string, string> = {
  'full-name': 'Nom complet',
  'job-title': 'Intitulé du poste',
  organization: 'Entreprise',
  'website-link': 'Site web',
  'email-address': 'Email',
  'appointment-link': 'Prendre RDV',
  'phone-mobile': 'Portable',
  'phone-standard': 'Standard',
}

const fallbackLabel = computed(() => {
  if (localValue.value.inlineWith) return 'Texte complémentaire'
  return defaultLabels[localValue.value.id ?? ''] ?? 'Champ personnalisé'
})

const fieldLabel = computed(() => localValue.value.label || fallbackLabel.value)
const labelOverride = computed({
  get: () => {
    const defaultLabel = defaultLabels[localValue.value.id ?? '']
    if (defaultLabel && localValue.value.label === defaultLabel) return ''
    return localValue.value.label
  },
  set: (value: string) => {
    const defaultLabel = defaultLabels[localValue.value.id ?? '']
    localValue.value.label = value || defaultLabel || ''
  },
})

const valuePlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    'full-name': 'Prénom Nom',
    'job-title': 'Intitulé du poste',
    organization: 'Entreprise',
    'website-link': 'https://exemple.com',
    'email-address': 'prenom.nom@exemple.fr',
    'appointment-link': 'https://cal.exemple.com/votre-lien',
    'phone-mobile': '06 00 00 00 00',
    'phone-standard': '04 00 00 00 00',
  }

  if (placeholders[localValue.value.id ?? '']) return placeholders[localValue.value.id ?? '']
  if (localValue.value.inlineWith && localValue.value.type === 'text') {
    return 'Contactez-moi à partir de 14h'
  }
  if (localValue.value.type === 'link') return 'https://exemple.com'
  if (localValue.value.type === 'email') return 'prenom.nom@exemple.fr'
  if (localValue.value.type === 'phone') return '04 00 00 00 00'
  return ''
})

function findInstalledIndex(tool: BasicTool) {
  if (!installed.value) return -1

  const basic = installed.value.tools.basic
  const id = tool.id ?? props.value.id

  if (id) {
    const indexById = basic.findIndex((i) => i.id === id)
    if (indexById >= 0) return indexById
  }

  const visibleFields = basic.filter((i) => i.type !== 'image')
  const visibleField = visibleFields[props.index]
  return visibleField ? basic.indexOf(visibleField) : -1
}

function update(tool: BasicTool) {
  if (!installed.value) return

  const { id, inlineWith, label, type, value } = tool
  const index = findInstalledIndex(tool)
  if (index < 0) return

  installed.value.tools.basic[index].id = id
  installed.value.tools.basic[index].inlineWith = inlineWith
  installed.value.tools.basic[index].label = label
  installed.value.tools.basic[index].type = type
  installed.value.tools.basic[index].value = value
}

function onRemoveField() {
  if (!installed.value) return
  const index = findInstalledIndex(localValue.value)
  if (index < 0) return

  const removedId = localValue.value.id
  installed.value.tools.basic.splice(index, 1)

  if (removedId) {
    installed.value.tools.basic = installed.value.tools.basic.filter(
      (field) => field.inlineWith !== removedId,
    )
  }
}

function onAddInlineField() {
  if (!installed.value) return

  const index = findInstalledIndex(localValue.value)
  if (index < 0) return

  if (!localValue.value.id) {
    localValue.value.id = nanoid(8)
    update(localValue.value)
  }

  const parentId = localValue.value.inlineWith || localValue.value.id
  installed.value.tools.basic.splice(index + 1, 0, {
    id: nanoid(8),
    inlineWith: parentId,
    label: '',
    main: false,
    type: 'text',
    value: '',
  })
}

watch(
  () => props.value,
  (v) => {
    if (isSameTool(localValue.value, v)) return
    localValue.value = clone<BasicTool>(v)
  },
  { deep: true },
)
watch(localValue, (v) => update(v), { deep: true })
</script>

<template>
  <UiFieldForm
    label-position="top"
    class="space-y-2"
  >
    <hr class="mx-auto mb-3 w-4/5 border-border/80">
    <UiFieldFormItem>
      <template #label>
        <UiFieldFormLabel>
          <div class="flex items-center justify-between w-full">
            <div class="grow">
              {{ fieldLabel }}
            </div>
            <div class="flex items-center">
              <UiPopover>
                <UiPopoverTrigger
                  tabindex="-1"
                  as-child
                >
                  <UiButton
                    variant="ghost"
                    size="icon-xs"
                  >
                    <UilSetting class="cursor-pointer" />
                  </UiButton>
                </UiPopoverTrigger>
                <UiPopoverContent>
                  <UiFieldForm
                    label-position="top"
                    class="space-y-3"
                  >
                    <UiFieldFormItem label="Libellé">
                      <UiInput
                        v-model="labelOverride"
                        placeholder="facultatif"
                      />
                    </UiFieldFormItem>
                    <UiFieldFormItem label="Type de champ">
                      <UiSelect v-model="localValue.type">
                        <UiSelectTrigger class="w-full">
                          <UiSelectValue placeholder="Sélectionner un type" />
                        </UiSelectTrigger>
                        <UiSelectContent>
                          <UiSelectGroup>
                            <UiSelectItem
                              v-for="i in attributes.types"
                              :key="i.value"
                              :value="i.value"
                            >
                              {{ i.label }}
                            </UiSelectItem>
                          </UiSelectGroup>
                        </UiSelectContent>
                      </UiSelect>
                    </UiFieldFormItem>
                    <UiButton
                      variant="secondary"
                      size="sm"
                      class="w-full"
                      @click="onAddInlineField"
                    >
                      Ajouter un champ sur la même ligne
                    </UiButton>
                    <UiButton
                      v-if="!localValue.main"
                      variant="destructive"
                      size="sm"
                      class="w-full"
                      @click="onRemoveField"
                    >
                      Supprimer le champ
                    </UiButton>
                  </UiFieldForm>
                </UiPopoverContent>
              </UiPopover>
            </div>
          </div>
        </UiFieldFormLabel>
      </template>
      <UiInput
        v-model="localValue.value"
        :placeholder="valuePlaceholder"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
