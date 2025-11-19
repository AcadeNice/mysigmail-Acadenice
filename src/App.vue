<!-- Modified src/App.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import 'vue-sonner/style.css'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'

import AuthDialog from '@/components/AuthDialog.vue'
import { useAccess } from '@/composables/useAccess'
// Import shared validation patterns instead of redefining regexes locally.  This
// ensures consistent validation between client and server and avoids
// duplication.
import { EMAIL_REGEX, FR_PHONE_REGEX } from '@/utils/validators.ts'

const { continueAsGuest, loadingRole, unlocked } = useAccess()
const route = useRoute()

const PUBLIC_ROUTES = ['/cgu']

const showGate = computed(() => {
  // on public page (/cgu), no gate
  if (PUBLIC_ROUTES.includes(route.path)) return false

  // for other pages
  return !unlocked.value
})

/* ---------- theme: follow system preference ---------- */
const isDark = ref<boolean>(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
function handleTheme(e: MediaQueryListEvent) {
  isDark.value = e.matches
}
onMounted(() => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.addEventListener?.('change', handleTheme)
})
onBeforeUnmount(() => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.removeEventListener?.('change', handleTheme)
})

/* ---------- form model ---------- */
const nameInput = ref('')
const emailInput = ref('')
const phoneInput = ref('')
const enterpriseInput = ref('') // optional

/* ---------- validation ---------- */
// Track which fields have been interacted with.  This controls when
// validation errors are displayed.
const touched = {
  name: ref(false),
  email: ref(false),
  phone: ref(false),
}

const nameError = computed(() =>
  touched.name.value && !nameInput.value.trim() ? 'Nom complet requis' : '',
)
const emailError = computed(() => {
  if (!touched.email.value) return ''
  const v = emailInput.value.trim()
  if (!v) return 'E‑mail requis'
  return EMAIL_REGEX.test(v) ? '' : 'E‑mail invalide'
})
const phoneNormalized = computed(() => phoneInput.value.trim())
const phoneError = computed(() => {
  if (!touched.phone.value) return ''
  const v = phoneNormalized.value
  if (!v) return 'Téléphone requis'
  return FR_PHONE_REGEX.test(v) ? '' : 'Format téléphone invalide'
})

const formValid = computed(
  () =>
    !!nameInput.value.trim()
    && EMAIL_REGEX.test(emailInput.value.trim())
    && FR_PHONE_REGEX.test(phoneNormalized.value),
)

/* ---------- submit ---------- */
const saving = ref(false)
const saveErr = ref('')
async function proceedAsGuest() {
  // Mark all fields as touched so validation messages show when missing
  touched.name.value = true
  touched.email.value = true
  touched.phone.value = true
  if (!formValid.value) return

  try {
    saving.value = true
    saveErr.value = ''
    await fetch('/api/guest/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneNormalized.value,
        enterprise: enterpriseInput.value.trim() || undefined,
      }),
    })
  } catch (e: any) {
    saveErr.value = e?.message || 'Erreur lors de l’enregistrement.'
  } finally {
    saving.value = false
  }

  continueAsGuest()
}

/* ---------- staff login ---------- */
function openStaffLogin() {
  window.dispatchEvent(new CustomEvent('open-auth-dialog'))
}

/* a11y helpers */
function markTouched(field: 'name' | 'email' | 'phone') {
  touched[field].value = true
}
</script>

<template>
  <div class="contents">
    <div v-if="!showGate">
      <RouterView />
    </div>

    <!-- Gate -->
    <div
      v-else
      class="fixed inset-0 z-[99999] grid place-items-center select-none"
      :class="isDark ? 'gate-overlay--dark' : 'gate-overlay--light'"
      aria-modal="true"
      role="dialog"
      aria-labelledby="guest-gate-title"
      tabindex="-1"
    >
      <div
        class="w-[min(92vw,620px)] rounded-2xl p-6 shadow-2xl"
        :class="isDark ? 'gate-card--dark' : 'gate-card--light'"
      >
        <!-- Heading -->
        <h2
          id="guest-gate-title"
          class="text-2xl font-semibold mb-1"
        >
          AcadéNice — Signature Utility
        </h2>

        <!-- Disclaimer (FR) -->
        <p
          class="text-sm mb-4"
          :class="isDark ? 'text-dark-muted' : 'text-light-muted'"
        >
          Vos données seront utilisées <strong>uniquement</strong> dans le cadre d’AcadéNice et ne
          seront <strong>jamais</strong> partagées avec des tiers.<br>
          <span class="inline-block mt-1">Vous pouvez continuer pour utiliser cet outil gratuitement.</span>
          <span
            class="block mt-1 text-[11px]"
            :class="isDark ? 'text-[#C7CFDD]' : 'text-neutral-500'"
          >
            Les fichiers ne sont téléversés que par le personnel connecté, en mode invité, tout
            reste dans votre navigateur.
          </span>
        </p>

        <!-- Guest form -->
        <div class="grid gap-3">
          <div>
            <UiInput
              v-model="nameInput"
              placeholder="Nom complet"
              :disabled="loadingRole || saving"
              :aria-invalid="!!nameError"
              @blur="markTouched('name')"
            />
            <p
              v-if="nameError"
              class="mt-1 text-xs text-red-500"
            >
              {{ nameError }}
            </p>
          </div>

          <div>
            <UiInput
              v-model="emailInput"
              type="email"
              placeholder="E-mail"
              :disabled="loadingRole || saving"
              :aria-invalid="!!emailError"
              @blur="markTouched('email')"
            />
            <p
              v-if="emailError"
              class="mt-1 text-xs text-red-500"
            >
              {{ emailError }}
            </p>
          </div>

          <div>
            <UiInput
              v-model="phoneInput"
              inputmode="tel"
              placeholder="Téléphone (FR)"
              :disabled="loadingRole || saving"
              :aria-invalid="!!phoneError"
              @blur="markTouched('phone')"
            />
            <p
              v-if="phoneError"
              class="mt-1 text-xs text-red-500"
            >
              {{ phoneError }}
            </p>
            <p
              class="mt-1 text-[11px]"
              :class="isDark ? 'text-dark-muted' : 'text-light-muted'"
            >
              Exemple : 06 12 34 56 78 ou +33 6 12 34 56 78
            </p>
          </div>

          <div>
            <UiInput
              v-model="enterpriseInput"
              placeholder="Entreprise (optionnel)"
              :disabled="loadingRole || saving"
            />
          </div>
        </div>

        <!-- Big button -->
        <UiButton
          class="mt-5 w-full h-11 text-base"
          :disabled="loadingRole || saving || !formValid"
          @click="proceedAsGuest"
        >
          Continuer en invité
        </UiButton>

        <!-- Error -->
        <p
          v-if="saveErr"
          class="mt-2 text-sm text-red-500"
        >
          {{ saveErr }}
        </p>

        <!-- Staff link + CGU link (vertical) -->
        <div class="mt-6 text-[12px] flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            class="underline hover:no-underline cursor-pointer"
            :class="isDark ? 'text-dark-link' : 'text-light-link'"
            @click="openStaffLogin"
          >
            Se connecter
          </button>

          <RouterLink
            to="/cgu"
            class="underline hover:no-underline"
            :class="isDark ? 'text-dark-link' : 'text-light-link'"
          >
            Conditions d’utilisation
          </RouterLink>
        </div>
      </div>
    </div>

    <AuthDialog />
    <Toaster position="bottom-right" />
  </div>
</template>

<style scoped>
/* ---------- Light/Dark overlays ---------- */
.gate-overlay--light {
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px) saturate(110%);
}
.gate-overlay--dark {
  /* Slightly brighter and more pastel than plain black */
  background:
    radial-gradient(1200px 600px at 10% 10%, rgba(110, 124, 255, 0.18), transparent 60%),
    radial-gradient(1000px 500px at 90% 20%, rgba(255, 132, 153, 0.16), transparent 55%),
    radial-gradient(900px 500px at 30% 90%, rgba(135, 255, 202, 0.14), transparent 50%), rgba(8, 12, 22, 0.78);
  backdrop-filter: blur(8px) saturate(115%);
}

/* ---------- Cards ---------- */
.gate-card--light {
  background: white;
  color: #0f172a;
}
.gate-card--dark {
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(600px 300px at -10% -10%, rgba(130, 170, 255, 0.12), transparent 60%),
    radial-gradient(600px 300px at 110% -10%, rgba(255, 170, 200, 0.1), transparent 60%),
    linear-gradient(180deg, rgba(22, 27, 39, 0.95), rgba(18, 22, 33, 0.95));
  color: #eaf0ff;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

/* ---------- Muted text colors ---------- */
.text-dark-muted {
  color: #c7cfdd;
}
.text-light-muted {
  color: #4b5563;
}
.text-dark-link {
  color: #e6ecff;
}
.text-light-link {
  color: #374151;
}
</style>
