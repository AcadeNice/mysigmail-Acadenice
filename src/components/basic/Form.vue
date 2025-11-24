<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
import { useImageVersion } from '@/composables/useImageVersion'
import { useSonner } from '@/composables/useSonner'

const { sonner } = useSonner()
const { init, installed, isInit, mainFields } = useSignatures()
const { imageVersion } = useImageVersion()
const { isUser, loadingRole } = useAccess()

/* ------------ Full Name → base ------------ */
function readFullName(): string {
  const basic = installed.value?.tools?.basic ?? []

  const cand
    = basic.find((f: any) => f.key === 'fullName')
      ?? basic.find((f: any) => f.id === 'full-name' || f.id === 'name')
      ?? basic.find((f: any) => /full\s*name|nom\s+complet/i.test(String(f?.label || '')))
      ?? basic[0]

  return (cand?.value ?? '').toString()
}
function toBaseName(input: string): string {
  if (!input) return ''
  let s = input.trim().toLowerCase()
  s = s.replace(/\s+/g, '_')
  s = s.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  s = s.replace(/[^a-z0-9_]/g, '')
  s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return s
}
// ---------- Prefill from guest gate ----------
const GUEST_PREFILL_KEY = 'acdn_guest_basic_prefill'
const prefillApplied = ref(false)

interface GuestPrefill {
  fullName?: string
  email?: string
  enterprise?: string
  phone?: string
}

function applyGuestPrefill(payload: GuestPrefill) {
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

  if (payload.fullName && fullNameField) fullNameField.value = payload.fullName
  if (payload.email && emailField) emailField.value = payload.email
  if (payload.enterprise && enterpriseField) enterpriseField.value = payload.enterprise
}

// reading sessionStorage, after we built /basic
onMounted(() => {
  if (isUser.value) return // only for guests
  // filling the form if data lost (with data saved before)
  if (!isInit.value) {
    init()
  }
  try {
    const raw = sessionStorage.getItem(GUEST_PREFILL_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as GuestPrefill

    applyGuestPrefill(data)
    prefillApplied.value = true
    sessionStorage.removeItem(GUEST_PREFILL_KEY)
  } catch (e) {
    console.error('[guest prefill] failed', e)
  }
})
/* ------------ where the filename is stored in the model ------------ */
const avatarField = computed(() => {
  const basic = installed.value?.tools?.basic ?? []
  return (
    basic.find((f: any) => f.key === 'avatar' || f.id === 'avatar' || f.key === 'image')
    ?? basic.find((f: any) => /avatar|photo|image/i.test(String(f?.label)))
    ?? null
  )
})

const fileName = computed<string>({
  get: () => (avatarField.value?.value ?? '') as string,
  set: (v: string) => {
    if (avatarField.value) avatarField.value.value = v
  },
})

/* ------------ URL mode ------------ */
const imageUrl = ref('')

const isHttpUrl = (s: string) => /^https?:\/\/\S+/i.test(s.trim())

// initialize imageUrl from the current value if it already contains a URL
watch(
  () => fileName.value,
  (v) => {
    imageUrl.value = isHttpUrl(v) ? v : ''
  },
  { immediate: true },
)

// write into the model when user changes the URL field
watch(imageUrl, (v) => {
  const t = v.trim()
  if (t) fileName.value = t
  else if (isHttpUrl(fileName.value)) fileName.value = '' // clear model if they cleared the URL
})

/* ------------ computations for uploader ------------ */
const fullName = ref(readFullName())
watch(
  () => readFullName(),
  (v) => {
    fullName.value = v
  },
  { immediate: true },
)
const baseName = computed(() => toBaseName(fullName.value))
const isDefaultFullName = computed(
  () =>
    fullName.value.trim().toLowerCase() === 'nom prénom'
    || fullName.value.trim().toLowerCase() === 'nom prenom',
)

const existingFile = ref<string>('')
const checking = ref(false)
let t: number | undefined

// controller for aborting in-flight file-info requests to avoid race conditions
const fileInfoController = ref<AbortController | null>(null)

// do not fetch /api/file-info for guests; and do not fetch if URL mode is active
watch(
  [baseName, isUser, imageUrl],
  async ([b, user, url]) => {
    // if URL is selected – skip file system check
    if (isHttpUrl(url)) {
      existingFile.value = ''
      checking.value = false
      return
    }

    fileName.value ||= '' // ensure string
    existingFile.value = ''
    if (!user || !b) return

    // clear previous timer and abort previous request if any
    clearTimeout(t)
    if (fileInfoController.value) {
      fileInfoController.value.abort()
      fileInfoController.value = null
    }
    t = window.setTimeout(async () => {
      checking.value = true
      fileInfoController.value = new AbortController()
      try {
        const res = await fetch(`/api/file-info?base=${encodeURIComponent(b)}`, {
          credentials: 'include',
          signal: fileInfoController.value.signal,
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) return
          throw new Error(`file-info ${res.status}`)
        }
        const data = await res.json()
        if (data?.exists && data?.filename) {
          existingFile.value = data.filename
          // important: do not overwrite URL if one was already selected
          if (!isHttpUrl(fileName.value)) fileName.value = data.filename
          if (data.mtime) imageVersion.value = Math.floor(data.mtime)
        } else {
          if (!isHttpUrl(fileName.value)) fileName.value = ''
          imageVersion.value = 0
        }
      } catch (e: any) {
        // ignore abort errors; show feedback for network/other failures
        if (e?.name !== 'AbortError') {
          if (!isHttpUrl(fileName.value)) fileName.value = ''
          imageVersion.value = 0
          sonner({
            title: 'Erreur',
            type: 'error',
            description: 'Une erreur est survenue lors de la vérification du fichier.',
          })
        }
      } finally {
        checking.value = false
        fileInfoController.value = null
      }
    }, 200)
  },
  { immediate: true },
)

/* ------------ upload only for isUser ------------ */
function extFromMime(m: string): 'jpg' | 'png' | 'gif' {
  if (m === 'image/png') return 'png'
  if (m === 'image/gif') return 'gif'
  return 'jpg'
}

async function onBeforeUpload(blob: Blob, mime: string) {
  if (!isUser.value) return
  if (isHttpUrl(imageUrl.value)) return // do not allow upload if URL mode is selected
  if (!baseName.value) {
    sonner({
      title: 'Nom complet requis',
      type: 'default',
      description: 'Veuillez renseigner le champ Nom complet en premier.',
    })
    throw new Error('no-full-name')
  }
  if (existingFile.value) {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Une image pour cet utilisateur existe déjà. La remplacer ?')
    if (!ok) throw new Error('cancelled')
  }

  const ext = existingFile.value ? existingFile.value.split('.').pop()! : extFromMime(mime)
  const finalName = `${baseName.value}.${ext}`

  const form = new FormData()
  form.append('base', baseName.value)
  form.append('file', blob, finalName)

  const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' })
  if (!res.ok) throw new Error(`upload-failed-${res.status}`)
  const data = await res.json()

  fileName.value = data.filename
  existingFile.value = data.filename
  if (data.mtime) imageVersion.value = Math.floor(data.mtime)

  sonner({ title: 'Succès', type: 'success', description: 'Image enregistrée.' })
}

function onUploaded(nameOrBlob: any) {
  if (!isUser.value || isHttpUrl(imageUrl.value)) return
  fileName.value = String(nameOrBlob)
}

/* ------------ convenient flag: can upload ------------ */
const canUpload = computed(
  () => isUser.value && !isHttpUrl(imageUrl.value) && !!baseName.value && !isDefaultFullName.value,
)
</script>

<template>
  <div>
    <UiFieldForm label-position="top">
      <UiFieldFormItem
        label="Image"
        description="Collez un lien public vers l’image."
      >
        <div class="grid gap-2">
          <!-- 1) URL (for everyone) -->
          <div class="flex items-center gap-2">
            <UiInput
              v-model="imageUrl"
              placeholder="https://exemple.com/avatar.png"
              :disabled="loadingRole"
              class="flex-1"
            />
            <span class="text-xs text-muted-foreground shrink-0"> URL (prioritaire) </span>
          </div>

          <!-- 2) Upload (only for user and only if no URL is selected) -->
          <div
            v-if="canUpload"
            class="flex items-center gap-2"
          >
            <UiUpload
              :disabled="!baseName || checking || loadingRole"
              :show-status="false"
              @upload-intent="onBeforeUpload($event.blob, $event.mime)"
              @uploaded="onUploaded"
            />
            <span class="text-xs text-muted-foreground">
              Nom de fichier :
              <strong>{{ baseName ? existingFile || `${baseName}.*` : '—' }}</strong>
            </span>
          </div>

          <!-- 3) Explanation for guest / when URL is active -->
          <div
            v-else
            class="text-xs text-muted-foreground"
          >
            <template v-if="!isUser">
              Vous pouvez utiliser un lien public ci-dessus.
            </template>
            <template v-else-if="imageUrl">
              Un lien d’image est renseigné — le téléversement est désactivé pour éviter les
              conflits.
            </template>
          </div>
        </div>
      </UiFieldFormItem>
    </UiFieldForm>

    <div class="mt-6 grid grid-cols-2 gap-4">
      <BasicFormItem
        v-for="(i, index) in mainFields"
        :key="i.id!"
        :index="index"
        :value="i"
      />
    </div>

    <BasicAddNewFiled />
  </div>
</template>
