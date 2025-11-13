<!-- AuthDialog.vue (или твой компонент модалки) -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useAccess } from '@/composables/useAccess'

const { continueAsGuest, isGuest, login } = useAccess()

const open = ref(false)
const input = ref('')
const error = ref('')

onMounted(() => {
  if (isGuest.value) open.value = true
})

async function onContinueAsGuest() {
  continueAsGuest()
  error.value = ''
  open.value = false
}

async function tryLogin() {
  try {
    await login(input.value) // сервер установит cookie
    error.value = ''
    open.value = false
  } catch (e: any) {
    error.value = e?.message || 'Invalid password.'
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') tryLogin()
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="sm:max-w-[420px]">
      <UiDialogHeader>
        <UiDialogTitle>Restricted area</UiDialogTitle>
        <UiDialogDescription>
          Enter a password to continue, or proceed as guest with limited features.
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="space-y-3">
        <UiInput
          v-model="input"
          type="password"
          placeholder="Password"
          autofocus
          @keydown="onKeydown"
        />
        <p
          v-if="error"
          class="text-sm text-red-500"
        >
          {{ error }}
        </p>
      </div>

      <UiDialogFooter class="mt-4 flex gap-2 justify-end">
        <UiButton
          variant="secondary"
          @click="onContinueAsGuest"
        >
          Continue as guest
        </UiButton>
        <UiButton @click="tryLogin">
          Enter
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
