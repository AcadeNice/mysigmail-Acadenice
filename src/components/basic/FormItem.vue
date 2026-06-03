<script setup lang="ts">
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
  return a.id === b.id && a.label === b.label && a.type === b.type && a.value === b.value
}

const contentLabel = computed(() => {
  if (localValue.value.type === 'link') return 'URL du lien'
  if (localValue.value.type === 'email') return 'Adresse e-mail'
  if (localValue.value.type === 'phone') return 'Numéro de téléphone'
  return 'Texte affiché'
})

const contentPlaceholder = computed(() => {
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

  const { label, type, value } = tool
  const index = findInstalledIndex(tool)
  if (index < 0) return

  installed.value.tools.basic[index].label = label
  installed.value.tools.basic[index].type = type
  installed.value.tools.basic[index].value = value
}

function onRemoveField() {
  if (!installed.value) return
  const index = findInstalledIndex(localValue.value)
  if (index < 0) return

  installed.value.tools.basic.splice(index, 1)
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
    <UiFieldFormItem>
      <template #label>
        <UiFieldFormLabel>
          <div class="flex items-center justify-between w-full">
            <div class="grow">
              Libellé
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
                    class="space-y-0"
                  >
                    <UiFieldFormItem label="Type">
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
                  </UiFieldForm>
                </UiPopoverContent>
              </UiPopover>
              <UiButton
                v-if="!localValue.main"
                variant="ghost"
                size="icon-xs"
                @click="onRemoveField"
              >
                <UilTrashAlt class="text-destructive" />
              </UiButton>
            </div>
          </div>
        </UiFieldFormLabel>
      </template>
      <UiInput v-model="localValue.label" />
    </UiFieldFormItem>
    <UiFieldFormItem :label="contentLabel">
      <UiInput
        v-model="localValue.value"
        :placeholder="contentPlaceholder"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
