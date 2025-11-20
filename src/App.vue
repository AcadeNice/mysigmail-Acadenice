<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'vue-sonner/style.css'
import { useRoute, useRouter } from 'vue-router'
import { Toaster } from 'vue-sonner'

import AuthDialog from '@/components/AuthDialog.vue'
import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
// Import shared validation patterns instead of redefining regexes locally.
import { EMAIL_REGEX, FR_PHONE_REGEX } from '@/utils/validators.ts'

const { continueAsGuest, loadingRole, unlocked } = useAccess()
const route = useRoute()
const router = useRouter()
const { installed } = useSignatures()

// Public routes that never auto-show the gate
const PUBLIC_ROUTES = ['/', '/cgu']
const GUEST_PREFILL_KEY = 'acdn_guest_basic_prefill'

// Whether route-based gate should show (user not unlocked on a protected page)
const showGate = computed(() => {
  // on public pages, no auto gate
  if (PUBLIC_ROUTES.includes(route.path)) return false
  // for other pages
  return !unlocked.value
})

// Extra flag: allow forcing the gate as a modal even on public routes
// (WelcomePage -> open-guest-gate)
const forceGate = ref(false)
function handleOpenGuestGate() {
  forceGate.value = true
}

// Final visibility flag
const gateVisible = computed(() => showGate.value || forceGate.value)

/* ---------- theme: follow system preference ---------- */
const isDark = ref<boolean>(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

function applyThemeClass(value: boolean) {
  const root = document.documentElement // <html>
  if (value) root.classList.add('dark')
  else root.classList.remove('dark')
}

function handleTheme(e: MediaQueryListEvent) {
  isDark.value = e.matches
  applyThemeClass(isDark.value)
}

onMounted(() => {
  // 1) initial theme from system
  applyThemeClass(isDark.value)

  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.addEventListener?.('change', handleTheme)

  // 2) listen for "Utiliser gratuitement" click from WelcomePage
  window.addEventListener('open-guest-gate', handleOpenGuestGate)
})

onBeforeUnmount(() => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.removeEventListener?.('change', handleTheme)

  window.removeEventListener('open-guest-gate', handleOpenGuestGate)
})

/* ---------- авто-редирект с / на /basic, если уже разблокировано ---------- */
watch(
  () => ({ unlocked: unlocked.value, path: route.path }),
  ({ path, unlocked }) => {
    if (unlocked && path === '/') {
      router.replace('/basic')
    }
  },
  { immediate: true },
)

/* ---------- form model ---------- */
const nameInput = ref('')
const emailInput = ref('')
const phoneInput = ref('')
const enterpriseInput = ref('') // optional

/* ---------- name safety rules ---------- */
// Max length for fields
const MAX_LENGTH = 40
// Allowed characters: letters (incl. accents), spaces, hyphen, apostrophe, dot.
const SAFE_NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'\-.\s]*$/u

// Sanitized version of the name: strip zero-width chars, collapse spaces, trim
const sanitizedName = computed(() =>
  nameInput.value
    // remove zero-width / BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // collapse multiple whitespaces into single space
    .replace(/\s+/g, ' ')
    .trim(),
)

/* ---------- validation ---------- */
// Track which fields have been interacted with.
const touched = {
  name: ref(false),
  email: ref(false),
  phone: ref(false),
}

const nameError = computed(() => {
  if (!touched.name.value) return ''

  const v = sanitizedName.value

  if (!v) return 'Nom complet requis'
  if (v.length > MAX_LENGTH) {
    return `Nom trop long (max ${MAX_LENGTH} caractères)`
  }
  if (!SAFE_NAME_REGEX.test(v)) {
    return 'Nom invalide (caractères non autorisés)'
  }
  return ''
})

const emailError = computed(() => {
  if (!touched.email.value) return ''
  const v = emailInput.value.trim()
  if (!v) return 'E-mail requis'
  return EMAIL_REGEX.test(v) ? '' : 'E-mail invalide'
})

const phoneNormalized = computed(() => phoneInput.value.trim())
const phoneError = computed(() => {
  if (!touched.phone.value) return ''
  const v = phoneNormalized.value
  if (!v) return 'Téléphone requis'
  return FR_PHONE_REGEX.test(v) ? ' ' : 'Format téléphone invalide'
})

const formValid = computed(
  () =>
    !nameError.value
    && !!sanitizedName.value
    && EMAIL_REGEX.test(emailInput.value.trim())
    && FR_PHONE_REGEX.test(phoneNormalized.value),
)

function applyGuestToSignature(payload: {
  fullName: string
  email: string
  phone: string
  enterprise?: string
}) {
  const basic = installed.value?.tools?.basic ?? []
  if (!basic.length) return

  const byLabel = (label: string) =>
    basic.find(
      (f: any) =>
        String(f.label || '')
          .trim()
          .toLowerCase() === label.toLowerCase(),
    )

  const fullNameField = byLabel('nom complet')
  const emailField = byLabel('email')
  const enterpriseField = byLabel('entreprise')

  if (fullNameField) fullNameField.value = payload.fullName
  if (emailField) emailField.value = payload.email
  if (enterpriseField && payload.enterprise) enterpriseField.value = payload.enterprise
}

/* ---------- submit ---------- */
const saving = ref(false)
const saveErr = ref('')

async function proceedAsGuest() {
  touched.name.value = true
  touched.email.value = true
  touched.phone.value = true

  if (!formValid.value) return

  const safeName = sanitizedName.value

  saving.value = true
  saveErr.value = ''

  try {
    const res = await fetch('/api/guest/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: safeName,
        email: emailInput.value.trim(),
        phone: phoneNormalized.value,
        enterprise: enterpriseInput.value.trim() || undefined,
      }),
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok || data?.ok !== true) {
      saveErr.value = data?.error || 'Erreur lors de l’enregistrement (serveur).'
      return
    }

    // 1) сохраним в sessionStorage
    try {
      sessionStorage.setItem(
        GUEST_PREFILL_KEY,
        JSON.stringify({
          fullName: safeName,
          email: emailInput.value.trim(),
          phone: phoneNormalized.value,
          enterprise: enterpriseInput.value.trim(),
        }),
      )
    } catch {
      // ignore
    }

    // 2) сразу пробросим в стор подписи
    applyGuestToSignature({
      fullName: safeName,
      email: emailInput.value.trim(),
      phone: phoneNormalized.value,
      enterprise: enterpriseInput.value.trim() || undefined,
    })

    // unlock access
    continueAsGuest()
    forceGate.value = false

    if (route.path === '/') {
      router.push('/basic')
    }
  } catch (e: any) {
    saveErr.value = e?.message || 'Erreur lors de l’enregistrement (réseau).'
  } finally {
    saving.value = false
  }
}

/* a11y helpers */
function markTouched(field: 'name' | 'email' | 'phone') {
  touched[field].value = true
}
</script>

<template>
  <div class="contents">
    <!-- When gate is not visible, just render the current route -->
    <div v-if="!gateVisible">
      <RouterView />
    </div>

    <!-- Gate (guest questionnaire) -->
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
          class="text-2xl font-semibold mb-1 text-center"
        >
          AcadéNice — Générateur de signature
        </h2>

        <!-- Disclaimer (FR) -->
        <p
          class="text-sm mb-4 text-center"
          :class="isDark ? 'text-dark-muted' : 'text-light-muted'"
        >
          <span class="inline-block mt-1">
            Vous pouvez continuer pour utiliser cet outil gratuitement.
          </span>
        </p>

        <!-- Guest form -> like in  /basic -->
        <div class="space-y-4">
          <!-- Nom complet -->
          <div class="space-y-1">
            <div class="text-sm font-medium flex items-center h-7">
              Nom complet
            </div>
            <UiInput
              v-model="nameInput"
              placeholder="Prénom Nom"
              :maxlength="MAX_LENGTH"
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

          <!-- Email -->
          <div class="space-y-1">
            <div class="text-sm font-medium flex items-center h-7">
              Email
            </div>
            <UiInput
              v-model="emailInput"
              type="email"
              placeholder="prenom.nom@acadenice.fr"
              :disabled="loadingRole || saving"
              :maxlength="MAX_LENGTH"
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

          <!-- Téléphone -->
          <div class="space-y-1">
            <div class="text-sm font-medium flex items-center h-7">
              Téléphone (FR)
            </div>
            <UiInput
              v-model="phoneInput"
              inputmode="tel"
              placeholder="06 12 34 56 78"
              :maxlength="MAX_LENGTH"
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

          <!-- Entreprise -->
          <div class="space-y-1">
            <div class="text-sm font-medium flex items-center h-7">
              Entreprise (optionnel)
            </div>
            <UiInput
              v-model="enterpriseInput"
              placeholder="AcadéNice"
              :disabled="loadingRole || saving"
              :maxlength="MAX_LENGTH"
            />
          </div>
        </div>

        <!-- Big button -->
        <UiButton
          class="mt-5 w-full h-11 text-base"
          :disabled="loadingRole || saving || !formValid"
          @click="proceedAsGuest"
        >
          Générer ma signature
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
