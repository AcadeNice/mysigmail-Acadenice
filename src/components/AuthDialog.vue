<!-- src/components/AuthDialog.vue -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAccess } from '@/composables/useAccess'

const { login } = useAccess()
const route = useRoute()
const router = useRouter()

const open = ref(false)
const input = ref('')
const error = ref('')

// автоопределение темы по системе
const isDark = ref<boolean>(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
function handleTheme(e: MediaQueryListEvent) {
  isDark.value = e.matches
}

// ref на обёртку вокруг инпута (ИМЕННО native <div>)
const inputWrapRef = ref<HTMLDivElement | null>(null)

function focusInput() {
  const el = inputWrapRef.value?.querySelector<HTMLInputElement>('input[type="password"]')
  el?.focus()
}

function handleOpenAuthDialog() {
  open.value = true
  error.value = ''
  input.value = ''
  nextTick(() => {
    focusInput()
  })
}

onMounted(() => {
  window.addEventListener('open-auth-dialog', handleOpenAuthDialog)
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.addEventListener?.('change', handleTheme)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-auth-dialog', handleOpenAuthDialog)
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.removeEventListener?.('change', handleTheme)
})

async function tryLogin() {
  try {
    await login(input.value) // тут уже внутри login() дергается refreshRole и проверяется роль
    error.value = ''
    open.value = false

    // если логинились с welcome-страницы – ведём в конструктор
    if (route.path === '/') {
      router.push('/basic')
    }
  } catch (e: any) {
    // 1) очищаем пароль при ошибке
    input.value = ''
    error.value = e?.message || 'Invalid password.'
    // 2) возвращаем фокус в поле
    await nextTick()
    focusInput()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') tryLogin()
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent
      class="sm:max-w-[420px] z-[100000] p-6 rounded-2xl"
      :class="isDark ? 'dark auth-card--dark' : 'auth-card--light'"
    >
      <UiDialogClose as-child>
        <button
          type="button"
          class="ui-close-btn"
          aria-label="Fermer"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </UiDialogClose>

      <UiDialogHeader>
        <UiDialogTitle :class="isDark ? 'text-white' : 'text-neutral-900'">
          Accès réservé
        </UiDialogTitle>
        <UiDialogDescription :class="isDark ? 'text-[#EAF0FF]/90' : 'text-neutral-600'">
          Entrez le mot de passe pour accéder aux fonctions réservées au personnel.
        </UiDialogDescription>
      </UiDialogHeader>

      <div
        ref="inputWrapRef"
        class="space-y-3 mt-3"
      >
        <UiInput
          v-model="input"
          type="password"
          placeholder="Mot de passe"
          autofocus
          :style="
            isDark
              ? {
                background: '#f1f5f9',
                color: '#0f172a',
                caretColor: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                boxShadow: 'none',
              }
              : {}
          "
          @keydown="onKeydown"
        />
        <p
          v-if="error"
          class="text-sm text-red-500"
        >
          {{ error }}
        </p>
      </div>

      <UiDialogFooter class="mt-5 flex gap-2 justify-end">
        <UiButton @click="tryLogin">
          Entrer
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

<style scoped>
/* ===== Кнопка закрытия — чтобы была видима и в дарке ===== */
.ui-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border-radius: 10px;
  background: transparent;
  color: #0f172a;
  opacity: 0.95;
  transition:
    opacity 0.15s ease,
    transform 0.1s ease,
    background 0.15s ease;
  cursor: pointer;
}
.ui-close-btn:hover {
  opacity: 1;
  transform: translateY(-1px);
  background: rgba(0, 0, 0, 0.04);
}
.ui-close-btn:focus-visible {
  outline: 2px solid rgba(30, 64, 175, 0.9);
  outline-offset: 3px;
}
.ui-close-btn svg {
  stroke: currentColor;
}

.auth-card--dark .ui-close-btn {
  color: #f2f6ff;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.25));
}
.auth-card--dark .ui-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.auth-card--dark .ui-close-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}
</style>
