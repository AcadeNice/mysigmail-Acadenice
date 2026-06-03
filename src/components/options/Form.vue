<script setup lang="ts">
import type { AvatarShape } from '@/composables/signatures/types'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { attributes } from '@/data/attributes'

const { isBgColorAvailable, isColumnSizeAvailable, isSecondColorAvailable, options }
  = useSignatures()

const avatarSize = computed({
  get: () => [options.value.avatarSize],
  set: (value) => {
    options.value.avatarSize = value[0]
  },
})

const column1Width = computed({
  get: () => [options.value.column1Width ?? 50],
  set: (value) => {
    options.value.column1Width = value[0]
  },
})

const mainColor = computed({
  get: () => options.value.mainColor,
  set: (val: string) => {
    options.value.mainColor = val
  },
})

const secondaryColor = computed({
  get: () => options.value.secondaryColor,
  set: (val: string) => {
    options.value.secondaryColor = val
  },
})

const bgColor = computed({
  get: () => options.value.bgColor,
  set: (val: string) => {
    options.value.bgColor = val
  },
})

const bgTextColor = computed({
  get: () => options.value.bgTextColor,
  set: (val: string) => {
    options.value.bgTextColor = val
  },
})

const avatar = computed({
  get: () => options.value.avatar,
  set: (val: boolean) => {
    options.value.avatar = val
  },
})

const avatarShape = computed({
  get: () => options.value.avatarShape,
  set: (val: AvatarShape) => {
    options.value.avatarShape = val
  },
})

const fontFamily = computed({
  get: () => options.value.fontFamily,
  set: (val: string) => {
    options.value.fontFamily = val
  },
})

const fontSize = computed({
  get: () => options.value.fontSize,
  set: (val: number) => {
    options.value.fontSize = val
  },
})

const jobSeparator = computed({
  get: () => options.value.jobSeparator,
  set: (val: string) => {
    options.value.jobSeparator = val
  },
})
</script>

<template>
  <div>
    <h3>Couleurs</h3>
    <UiFieldForm class="mb-4">
      <UiFieldFormItem label="Couleur principale">
        <UiColorPicker v-model="mainColor" />
      </UiFieldFormItem>
      <UiFieldFormItem
        v-if="isSecondColorAvailable"
        label="Couleur secondaire"
      >
        <UiColorPicker v-model="secondaryColor" />
      </UiFieldFormItem>
      <UiFieldFormItem
        v-if="isBgColorAvailable"
        label="Arrière-plan"
      >
        <UiColorPicker v-model="bgColor" />
      </UiFieldFormItem>
      <UiFieldFormItem
        v-if="isBgColorAvailable"
        label="Texte sur arrière-plan"
      >
        <UiColorPicker v-model="bgTextColor" />
      </UiFieldFormItem>
    </UiFieldForm>
    <h3>Photo / logo</h3>
    <UiFieldForm class="mb-4">
      <UiFieldFormItem label="Afficher">
        <UiSwitch v-model="avatar" />
      </UiFieldFormItem>
      <UiFieldFormItem
        label="Taille"
        :description="`Largeur en pixels. Actuel : ${avatarSize[0]}px`"
      >
        <div class="flex items-center h-5">
          <UiSlider
            v-model="avatarSize"
            :max="150"
            :min="50"
          />
        </div>
      </UiFieldFormItem>
      <UiFieldFormItem label="Forme">
        <UiSelect v-model="avatarShape">
          <UiSelectTrigger>
            <UiSelectValue placeholder="Sélectionner une valeur" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="item in attributes.avatar.roundness"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFieldFormItem>
    </UiFieldForm>
    <template v-if="isColumnSizeAvailable">
      <h3>Taille des colonnes</h3>
      <UiFieldForm class="mb-4">
        <UiFieldFormItem
          label="Colonne 1"
          :description="`Largeur en pourcentage. Actuel : ${column1Width[0]}%`"
        >
          <div class="flex items-center h-5">
            <UiSlider
              v-model="column1Width"
              :max="100"
              :min="10"
            />
          </div>
        </UiFieldFormItem>
      </UiFieldForm>
    </template>
    <h3>Police</h3>
    <UiFieldForm class="mb-4">
      <UiFieldFormItem label="Famille">
        <UiSelect v-model="fontFamily">
          <UiSelectTrigger>
            <UiSelectValue placeholder="Sélectionner une valeur" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup
              v-for="(group, index) in attributes.font.family"
              :key="index"
            >
              <UiSelectLabel>{{ group.label }}</UiSelectLabel>
              <UiSelectItem
                v-for="item in group.options"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFieldFormItem>
      <UiFieldFormItem label="Taille">
        <UiSelect v-model="fontSize">
          <UiSelectTrigger>
            <UiSelectValue placeholder="Sélectionner une valeur" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="item in attributes.font.size"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFieldFormItem>
    </UiFieldForm>
    <h3>Autres</h3>
    <UiFieldForm class="mb-4">
      <UiFieldFormItem label="Séparateur poste / entreprise">
        <UiSelect v-model="jobSeparator">
          <UiSelectTrigger>
            <UiSelectValue placeholder="Sélectionner une valeur" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="item in attributes.separator.options"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFieldFormItem>
    </UiFieldForm>
  </div>
</template>

<style lang="scss"></style>
