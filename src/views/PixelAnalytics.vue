<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { useAccess } from '@/composables/useAccess'

// Access control: only show analytics to authenticated users.  Guests will see a
// message instead.  We fetch statistics from `/api/pixel-stats` and display
// aggregated counts by date and by signature (as passed via the `sig`
// query parameter).
const { isUser, loadingRole } = useAccess()

interface PixelStats {
  total: number
  byDate: Record<string, number>
  bySignature: Record<string, number>
  byRecipient?: Record<string, number>
}
interface PixelLogEntry {
  ts: number
  ip?: string
  ua?: string
  q?: {
    sender?: string
    sig?: string
    t?: string
    rcpt?: string
    [key: string]: any
  }
}

const logItems = ref<PixelLogEntry[]>([])
const stats = ref<PixelStats>({ total: 0, byDate: {}, bySignature: {} })
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // 1) агрегированная статистика
    const res = await fetch('/api/pixel-stats', { credentials: 'include' })
    if (!res.ok) {
      throw new Error(`Failed to load stats (${res.status})`)
    }
    const data = await res.json()
    stats.value = data

    // 2) сырые логи (последние N)
    const resLog = await fetch('/api/pixel-log?limit=200', { credentials: 'include' })
    if (resLog.ok) {
      const logData = await resLog.json()
      if (Array.isArray(logData.items)) {
        logItems.value = logData.items
      }
    }
  } catch (e: any) {
    error.value = e?.message || 'Erreur lors du chargement des statistiques.'
  } finally {
    loading.value = false
  }
})
const logEntries = computed(() => {
  return [...logItems.value].sort((a, b) => b.ts - a.ts)
})
// Sort date entries descending by date
const dateEntries = computed(() => {
  const entries = Object.entries(stats.value.byDate || {})
  return entries.sort((a, b) => (a[0] < b[0] ? 1 : -1))
})

// Sort signature entries descending by count
const sigEntries = computed(() => {
  const entries = Object.entries(stats.value.bySignature || {})
  return entries.sort((a, b) => b[1] - a[1])
})

const recipientEntries = computed(() => {
  const entries = Object.entries(stats.value.byRecipient || {})
  return entries.sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-semibold mb-4">
      Statistiques de Pixel
    </h1>

    <div
      v-if="loading || loadingRole"
      class="text-muted-foreground"
    >
      Chargement…
    </div>

    <div v-else>
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

        <p class="mb-4">
          Total d’ouvertures enregistrées : {{ stats.total }}
        </p>

        <!-- Par date -->
        <h2 class="text-xl font-semibold mb-2">
          Par date
        </h2>

        <div class="overflow-x-auto mb-6">
          <table class="min-w-[300px] border border-gray-200 dark:border-gray-700 w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800">
                <th class="px-3 py-2 text-left">
                  Date
                </th>
                <th class="px-3 py-2 text-left">
                  Nombre d’ouvertures
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="[date, count] in dateEntries"
                :key="date"
                class="border-t border-gray-100 dark:border-gray-700"
              >
                <td class="px-3 py-2 font-mono">
                  {{ date }}
                </td>
                <td class="px-3 py-2">
                  {{ count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Par signature -->
        <h2 class="text-xl font-semibold mb-2">
          Par signature
        </h2>

        <div class="overflow-x-auto mb-6">
          <table class="min-w-[300px] border border-gray-200 dark:border-gray-700 w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800">
                <th class="px-3 py-2 text-left">
                  Identifiant de signature
                </th>
                <th class="px-3 py-2 text-left">
                  Nombre d’ouvertures
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="[sig, count] in sigEntries"
                :key="sig"
                class="border-t border-gray-100 dark:border-gray-700"
              >
                <td class="px-3 py-2 font-mono">
                  {{ sig }}
                </td>
                <td class="px-3 py-2">
                  {{ count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Par destinataire -->
        <h2 class="text-xl font-semibold mb-2">
          Par destinataire
        </h2>

        <div class="overflow-x-auto mb-6">
          <table class="min-w-[300px] border border-gray-200 dark:border-gray-700 w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800">
                <th class="px-3 py-2 text-left">
                  Destinataire (rcpt)
                </th>
                <th class="px-3 py-2 text-left">
                  Nombre d’ouvertures
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="[rcpt, count] in recipientEntries"
                :key="rcpt"
                class="border-t border-gray-100 dark:border-gray-700"
              >
                <td class="px-3 py-2 font-mono">
                  {{ rcpt }}
                </td>
                <td class="px-3 py-2">
                  {{ count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Détail : date/heure + rcpt + sig + sender -->
        <h2 class="text-xl font-semibold mb-2">
          Dernières ouvertures (détail)
        </h2>

        <div class="overflow-x-auto">
          <table class="min-w-[300px] border border-gray-200 dark:border-gray-700 w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800">
                <th class="px-3 py-2 text-left">
                  Date / heure
                </th>
                <th class="px-3 py-2 text-left">
                  Destinataire (rcpt)
                </th>
                <th class="px-3 py-2 text-left">
                  Signature (sig)
                </th>
                <th class="px-3 py-2 text-left">
                  Expéditeur (sender)
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="entry in logEntries"
                :key="`${entry.ts}-${entry.q?.rcpt || ''}-${entry.q?.sig || ''}`"
                class="border-t border-gray-100 dark:border-gray-700"
              >
                <td class="px-3 py-2 font-mono whitespace-nowrap">
                  {{ new Date(entry.ts).toLocaleString() }}
                </td>
                <td class="px-3 py-2 font-mono">
                  {{ entry.q?.rcpt || '—' }}
                </td>
                <td class="px-3 py-2 font-mono">
                  {{ entry.q?.sig || '—' }}
                </td>
                <td class="px-3 py-2 font-mono">
                  {{ entry.q?.sender || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
