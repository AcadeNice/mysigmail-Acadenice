<script setup lang="ts">
import { useFocus } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'

import { useHeaderPreview } from './composables'

const { openDialog } = useHeaderPreview()
const { installed } = useSignatures()

// Поле для автофокуса
const firstField = ref<HTMLInputElement | null>(null)
useFocus(firstField, { initialValue: true })

const isPending = ref(false)

// Локальная копия имени (label) для редактирования
const localName = ref<string>('')

// Двусторонняя связь с установленной подписью: читаем текущий label,
// а при вводе пишем в локальное значение, чтобы сохранить по кнопке.
const name = computed<string>({
  get() {
    // подстраховка: если локальное пустое — подтянем из installed
    return localName.value !== '' ? localName.value : (installed.value?.label ?? '')
  },
  set(v) {
    localName.value = v
  },
})

// Перед открытием модалки (когда openDialog станет true) — синхронизируем локальное поле
watch(
  () => openDialog.value,
  (open) => {
    if (open) {
      localName.value = installed.value?.label ?? ''
      // небольшой тик, чтобы фокус встал в инпут после открытия
      requestAnimationFrame(() => firstField.value?.focus())
    }
  },
  { immediate: true },
)

async function onSave() {
  isPending.value = true
  try {
    const next = (localName.value ?? '').trim()
    if (next) {
      // сохраняем только label (человеко-читаемое имя шаблона)
      installed.value.label = next
    }
    openDialog.value = false
  } finally {
    isPending.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="openDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <FormField name="label">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <UiInput
              ref="firstField"
              v-model="name"
              placeholder="New name"
            />
          </FormItem>
        </FormField>
      </div>

      <DialogFooter>
        <Button
          class="w-full mt-4"
          :disabled="isPending"
          @click="onSave"
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
