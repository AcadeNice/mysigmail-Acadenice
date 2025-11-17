<script setup lang="ts">
import { ref } from 'vue'

import { useAccess } from '@/composables/useAccess'

// Access control: only authenticated users can sync their signature.
const { isUser } = useAccess()

const loading = ref(false)
const success = ref('')
const error = ref('')

function loginWithGoogle() {
  // Start the Google OAuth flow.  This redirects the browser to the
  // consent screen and then back to /gmail after authorization.
  window.location.href = '/api/gmail/auth'
}

async function syncSignature() {
  // Do not allow guests to sync signatures.
  try {
    loading.value = true
    error.value = ''
    success.value = ''
    // Locate the element containing the signature.  This element is
    // rendered by the signature generator and has a data-slot attribute.
    const el = document.querySelector('[data-slot="signature"]') as HTMLElement | null
    if (!el) {
      error.value = 'Aucune signature à synchroniser.'
      return
    }
    // Remove Vue comment markers from the HTML before sending to Gmail.
    const html = el.outerHTML.replace(/<!--v-if-->/g, '')
    const res = await fetch('/api/gmail/signature', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || 'Erreur lors de la synchronisation.')
    }
    success.value = 'Signature synchronisée avec succès avec Gmail.'
  } catch (e: any) {
    error.value = e?.message || 'Erreur de synchronisation.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-semibold mb-4">
      Intégration Gmail
    </h1>

    <div v-if="!isUser">
      <p class="text-red-500">
        Cette page est réservée au personnel connecté.
      </p>
    </div>

    <div v-else>
      <div
        v-if="error"
        class="text-red-500 mb-4"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="text-green-600 mb-4"
      >
        {{ success }}
      </div>

      <button
        type="button"
        class="mb-4 inline-flex items-center px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors"
        @click="loginWithGoogle"
      >
        Se connecter avec Google
      </button>

      <button
        type="button"
        class="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        :disabled="loading"
        @click="syncSignature"
      >
        {{ loading ? 'Synchronisation…' : 'Synchroniser la signature' }}
      </button>
    </div>
  </div>
</template>
