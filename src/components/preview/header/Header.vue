<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UilAngleDown from '~icons/uil/angle-down'
import UilExclamationTriangle from '~icons/uil/exclamation-triangle'
import UilGoogle from '~icons/uil/google'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
import { useCopySignature } from '@/composables/useCopySignature'
import { useSonner } from '@/composables/useSonner'

// copy / size of HTML
const { isHtmlLarge, onCopyHTML, onCopySelect } = useCopySignature()
// JSON (import/export of signature)
const { downloadJSON, installed, uploadJSON } = useSignatures()
// toasts
const { sonner } = useSonner()
// roles (guest / user)
const { isUser } = useAccess()

const disconnectingSite = ref(false)
const inputRef = ref<HTMLInputElement>()
const loadingGmail = ref(false)
const disconnectingGmail = ref(false)
// connected to Google? (checking for valid creds)
const gmailConnected = ref(false)

function onDownload() {
  downloadJSON(installed.value)
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    await uploadJSON(reader.result as string)
    sonner({
      title: 'Success',
      type: 'success',
      description: 'Signature uploaded successfully',
    })
  }
  reader.readAsText(file)
}

// google status after loading page
onMounted(async () => {
  try {
    const res = await fetch('/api/gmail/status', { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    gmailConnected.value = !!data?.connected
  } catch {
    gmailConnected.value = false
  }
})

// sending Gmail signature
async function addToGmail() {
  const el = document.querySelector('[data-slot="signature"]') as HTMLElement | null
  if (!el) {
    sonner({
      title: 'Oops!',
      type: 'error',
      description: 'Aucune signature à synchroniser.',
    })
    return
  }

  const html = el.outerHTML.replace(/<!--v-if-->/g, '')

  loadingGmail.value = true
  try {
    const res = await fetch('/api/gmail/signature', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    // if token expires force  Google auth
    if (res.status === 401 && (data?.error === 'google_auth_required' || !data)) {
      window.location.href = '/api/gmail/auth'
      return
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Erreur lors de la synchronisation.')
    }

    gmailConnected.value = true

    sonner({
      title: 'Succès',
      type: 'success',
      description: 'Signature synchronisée avec succès avec Gmail.',
    })
  } catch (e: any) {
    sonner({
      title: 'Erreur',
      type: 'error',
      description: e?.message || 'Erreur de synchronisation.',
    })
  } finally {
    loadingGmail.value = false
  }
}

// Auth Google
async function disconnectGoogle() {
  disconnectingGmail.value = true
  try {
    const res = await fetch('/api/gmail/disconnect', {
      method: 'POST',
      credentials: 'include',
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Erreur lors de la déconnexion.')
    }

    gmailConnected.value = false

    sonner({
      title: 'Google déconnecté',
      type: 'success',
      description: 'Le compte Google a été déconnecté pour la synchronisation.',
    })
  } catch (e: any) {
    sonner({
      title: 'Erreur',
      type: 'error',
      description: e?.message || 'Impossible de déconnecter Google.',
    })
  } finally {
    disconnectingGmail.value = false
  }
}

async function disconnectSite() {
  disconnectingSite.value = true
  try {
    // 1) exiting Google (if we had one)
    try {
      await fetch('/api/gmail/disconnect', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore if its not a case
    }

    // 2) admin logout (removing httpOnly access_token)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore
    }

    // 3) clearing client-side storage
    try {
      // sessionStorage — guest prefill
      sessionStorage.clear()

      // localStorage — only ours
      const keysToClearPrefixes = ['acdn_', 'sign_', 'signature_', 'acadenice_']
      for (const key of Object.keys(localStorage)) {
        if (keysToClearPrefixes.some((p) => key.startsWith(p))) {
          localStorage.removeItem(key)
        }
      }
    } catch {
      // nothing
    }

    // 4) updating UI / role
    gmailConnected.value = false

    sonner({
      title: 'Déconnexion complète',
      type: 'success',
      description: 'Votre session et la connexion Google ont été réinitialisées.',
    })

    // forwarding to  /
    window.location.href = '/'
  } catch (e: any) {
    sonner({
      title: 'Erreur',
      type: 'error',
      description: e?.message || 'Impossible de se déconnecter complètement.',
    })
  } finally {
    disconnectingSite.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div />
    <div class="flex gap-2">
      <UiButton
        variant="outline"
        @click="inputRef?.click()"
      >
        Upload JSON
      </UiButton>

      <!-- Add to Gmail -->
      <UiButton
        variant="outline"
        :disabled="loadingGmail"
        @click="addToGmail"
      >
        <UilGoogle class="mr-1 w-4 h-4" />
        {{ loadingGmail ? 'Gmail…' : 'Add to Gmail' }}
      </UiButton>
      <!-- Déconnecter Google -->
      <UiButton
        v-if="gmailConnected"
        variant="ghost"
        :disabled="disconnectingGmail"
        @click="disconnectGoogle"
      >
        {{ disconnectingGmail ? 'Déconnexion…' : 'Déconnecter Google' }}
      </UiButton>

      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton variant="outline">
            Get Signature
            <UilAngleDown class="ml-1 -mr-1 opacity-50 w-5 h-5" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent class="w-32">
          <UiDropdownMenuItem @click="onCopySelect">
            Copy as Select
          </UiDropdownMenuItem>
          <UiDropdownMenuItem @click="onCopyHTML">
            Copy as HTML
          </UiDropdownMenuItem>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem @click="onDownload">
            Download JSON
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      <!-- Déconnexion complète du site -->
      <UiButton
        variant="destructive"
        :disabled="disconnectingSite"
        @click="disconnectSite"
      >
        {{ disconnectingSite ? 'Déconnexion en cours…' : 'Se déconnecter' }}
      </UiButton>
    </div>
  </div>

  <div
    v-if="isHtmlLarge"
    class="mt-3"
  >
    <UiAlert>
      <UilExclamationTriangle
        name="uil:exclamation-triangle"
        class="size-4"
      />
      <UiAlertTitle> Signature is too large </UiAlertTitle>
      <UiAlertDescription>
        The HTML code for the signature exceeds 10,000 characters, which may be too much for some
        email clients (e.g., Outlook or Gmail). We recommend reducing the size: remove unnecessary
        add-ons or shorten the text.
      </UiAlertDescription>
    </UiAlert>
  </div>

  <input
    ref="inputRef"
    style="display: none"
    type="file"
    accept=".json"
    @change="onFileSelected"
  >
</template>
