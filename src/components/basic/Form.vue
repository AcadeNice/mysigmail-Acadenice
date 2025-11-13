<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
import { useImageVersion } from '@/composables/useImageVersion'
import { useSonner } from '@/composables/useSonner'

const { sonner } = useSonner()
const { installed, mainFields } = useSignatures()
const { imageVersion } = useImageVersion()
const { isUser, loadingRole } = useAccess()

/* ------------ Full Name → base ------------ */
function readFullName(): string {
  const basic = installed.value?.tools?.basic ?? []
  const cand
    = basic.find((f: any) => f.key === 'fullName' || f.id === 'full-name')
      ?? basic.find((f: any) => /full\s*name/i.test(String(f?.label)))
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

/* ------------ где храним значение картинки в модели ------------ */
const fileName = computed<string>({
  get: () => installed.value?.tools.basic[0].value || '',
  set: (v: string) => {
    if (installed.value) installed.value.tools.basic[0].value = v
  },
})

/* ------------ URL режима ------------ */
const imageUrl = ref('')

const isHttpUrl = (s: string) => /^https?:\/\/\S+/i.test(s.trim())

// инициализируем imageUrl из текущего значения, если там уже был URL
watch(
  () => fileName.value,
  (v) => {
    imageUrl.value = isHttpUrl(v) ? v : ''
  },
  { immediate: true },
)

// когда пользователь меняет поле URL — сразу пишем в модель
watch(imageUrl, (v) => {
  const t = v.trim()
  if (t) fileName.value = t
  else if (isHttpUrl(fileName.value)) fileName.value = '' // если очищают URL — чистим модель, чтобы не висел старый URL
})

/* ------------ вычисления для загрузчика ------------ */
const fullName = ref(readFullName())
watch(
  () => readFullName(),
  (v) => {
    fullName.value = v
  },
  { immediate: true },
)
const baseName = computed(() => toBaseName(fullName.value))

const existingFile = ref<string>('')
const checking = ref(false)
let t: number | undefined

// не ходим в /api/file-info для гостей; и НЕ ходим, если включён URL-режим
watch(
  [baseName, isUser, imageUrl],
  async ([b, user, url]) => {
    // если сейчас выбран URL — не проверяем файловую систему
    if (isHttpUrl(url)) {
      existingFile.value = ''
      checking.value = false
      return
    }

    fileName.value ||= '' // убедимся, что строка
    existingFile.value = ''
    if (!user || !b) return

    clearTimeout(t)
    t = window.setTimeout(async () => {
      checking.value = true
      try {
        const res = await fetch(`/api/file-info?base=${encodeURIComponent(b)}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) return
          throw new Error(`file-info ${res.status}`)
        }
        const data = await res.json()
        if (data?.exists && data?.filename) {
          existingFile.value = data.filename
          // ВАЖНО: не затираем URL, если он был; записываем файл, только если URL пуст
          if (!isHttpUrl(fileName.value)) fileName.value = data.filename
          if (data.mtime) imageVersion.value = Math.floor(data.mtime)
        } else {
          if (!isHttpUrl(fileName.value)) fileName.value = ''
          imageVersion.value = 0
        }
      } catch {
        if (!isHttpUrl(fileName.value)) fileName.value = ''
        imageVersion.value = 0
      } finally {
        checking.value = false
      }
    }, 200)
  },
  { immediate: true },
)

/* ------------ upload только для isUser ------------ */
function extFromMime(m: string): 'jpg' | 'png' | 'gif' {
  if (m === 'image/png') return 'png'
  if (m === 'image/gif') return 'gif'
  return 'jpg'
}

async function onBeforeUpload(blob: Blob, mime: string) {
  if (!isUser.value) return
  if (isHttpUrl(imageUrl.value)) return // если выбран URL — не даём грузить файл, чтобы не путать
  if (!baseName.value) {
    sonner({
      title: 'Full Name is required',
      type: 'default',
      description: 'Please fill the Full Name field first.',
    })
    throw new Error('no-full-name')
  }
  if (existingFile.value) {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('An image for this user already exists. Replace it?')
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

  sonner({ title: 'Success', type: 'success', description: 'Image saved.' })
}

function onUploaded(nameOrBlob: any) {
  if (!isUser.value || isHttpUrl(imageUrl.value)) return
  fileName.value = String(nameOrBlob)
}

/* ------------ удобный флаг: можно ли показывать аплоад ------------ */
const canUpload = computed(() => isUser.value && !isHttpUrl(imageUrl.value))
</script>

<template>
  <div>
    <UiFieldForm label-position="top">
      <UiFieldFormItem
        label="Image"
        description="Collez un lien public vers l’image ou, si vous êtes connecté, téléversez un fichier."
      >
        <div class="grid gap-2">
          <!-- 1) URL (для всех) -->
          <div class="flex items-center gap-2">
            <UiInput
              v-model="imageUrl"
              placeholder="https://exemple.com/avatar.png"
              :disabled="loadingRole"
              class="flex-1"
            />
            <span class="text-xs text-muted-foreground shrink-0"> URL (prioritaire) </span>
          </div>

          <!-- 2) Upload (только для user и только если не выбран URL) -->
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
              File name:
              <strong>{{ baseName ? existingFile || `${baseName}.*` : '—' }}</strong>
            </span>
          </div>

          <!-- 3) Пояснение для гостя / когда URL активен -->
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
