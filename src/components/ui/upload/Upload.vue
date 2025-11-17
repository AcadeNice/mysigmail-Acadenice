<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'

import 'cropperjs/dist/cropper.css'
import Cropper from 'cropperjs'
import { computed, nextTick, ref, watch } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useSonner } from '@/composables/useSonner'

interface Props {
  cropWidth?: number
  cropHeight?: number
  quality?: number
}
interface Emits {
  (e: 'uploaded', nameOrUrl: string): void
}

const props = withDefaults(defineProps<Props>(), { quality: 0.9 })
const emit = defineEmits<Emits>()
const { sonner } = useSonner()
const { installed } = useSignatures()

// ---- роль тянем С СЕРВЕРА ----
const isUser = ref(false)
const loadingRole = ref(true)
async function fetchRole() {
  loadingRole.value = true
  try {
    const res = await fetch('/api/auth/status', { credentials: 'include' })
    const data = await res.json()
    isUser.value = data?.role === 'user'
  } catch {
    isUser.value = false
  } finally {
    loadingRole.value = false
  }
}
fetchRole()

// ---- базовое имя из Full Name для user ----
function readFullName(): string {
  const basic = installed.value?.tools?.basic ?? []
  const cand
    = basic.find((f: any) => f.key === 'fullName' || f.id === 'full-name')
      ?? basic.find((f: any) => /full\s*name/i.test(String(f?.label)))
      ?? basic[0]
  return (cand?.value ?? '').toString()
}
function sanitizeBase(input: string): string {
  if (!input) return ''
  let s = input.trim().toLowerCase()
  s = s.replace(/\s+/g, '_')
  s = s.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  s = s.replace(/[^a-z0-9_]/g, '')
  s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return s
}
const fullName = ref(readFullName())
watch(
  () => readFullName(),
  (v) => {
    fullName.value = v
  },
)
const baseName = computed(() => sanitizeBase(fullName.value))

// ---- проверка наличия файла (только user) ----
const existingFile = ref<string>('') // john_doe.png
const checking = ref(false)
let t: number | undefined
watch(
  [baseName, isUser],
  ([b, user]) => {
    existingFile.value = ''
    if (!user || !b) return
    clearTimeout(t)
    t = window.setTimeout(async () => {
      checking.value = true
      try {
        const res = await fetch(`/api/file-info?base=${encodeURIComponent(b)}`, {
          credentials: 'include',
        })
        const data = await res.json()
        existingFile.value = data?.exists ? String(data.filename || '') : ''
      } catch {
        existingFile.value = ''
      } finally {
        checking.value = false
      }
    }, 200)
  },
  { immediate: true },
)

// ---- guest URL input ----
const urlForGuest = ref('')

// ---- cropper (user) ----
let cropper: Cropper | null = null
const openDialog = ref(false)
const file = ref<File | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const croppedPreview = ref('')
const aspectRatio = ref(1)
const widthOriginal = ref<number>()
const widthResized = ref<number>()
const isPending = ref(false)

const aspectRatios = [
  { value: 1, label: '1:1' },
  { value: 4 / 3, label: '4:3' },
  { value: 2 / 3, label: '2:3' },
  { value: 16 / 9, label: '16:9' },
  { value: Number.NaN, label: 'Free' },
]
const cropPreview = computed(() => (file.value ? URL.createObjectURL(file.value) : ''))
const buttonText = computed(() =>
  isPending.value ? 'Uploading…' : existingFile.value ? 'Replace' : 'Upload',
)

function onClick() {
  if (!isUser.value) return
  if (!baseName.value) {
    sonner({
      title: 'Full Name is required',
      type: 'error',
      description: 'Fill the Full Name first.',
    })
    return
  }
  file.value = null
  openDialog.value = true
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/gif'
  input.onchange = (e: any) => {
    const f: File | undefined = e.target?.files?.[0]
    if (!f) {
      openDialog.value = false
      return
    }
    file.value = f
    nextTick(() => initCropper())
  }
  input.click()
}

function initCropper() {
  if (!imageRef.value) return
  if (cropper) {
    cropper.replace(cropPreview.value!)
  } else {
    cropper = new Cropper(imageRef.value, {
      aspectRatio: aspectRatio.value,
      viewMode: 1,
      autoCropArea: 1,
      zoomable: false,
      crop: () => {
        croppedPreview.value = cropper?.getCroppedCanvas().toDataURL() || ''
      },
    })
  }
}

function setAspectRatio(v: AcceptableValue) {
  cropper?.setAspectRatio(v as number)
}

function getCroppedImage() {
  return new Promise<Blob>((resolve) => {
    cropper
      ?.getCroppedCanvas({
        width: widthResized.value || props.cropWidth,
        imageSmoothingQuality: 'medium',
      })
      .toBlob((blob) => resolve(blob!), file.value?.type, props.quality)
  })
}

function extFromMime(m: string): 'jpg' | 'png' | 'gif' {
  if (m === 'image/png') return 'png'
  if (m === 'image/gif') return 'gif'
  return 'jpg'
}

async function uploadImage() {
  if (!isUser.value || !file.value) return
  if (!baseName.value) {
    sonner({
      title: 'Full Name is required',
      type: 'error',
      description: 'Fill the Full Name first.',
    })
    return
  }
  if (existingFile.value) {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('An image already exists. Replace it?')
    if (!ok) return
  }

  isPending.value = true
  const blob = await getCroppedImage()
  if (!blob || (blob as any).size === 0) {
    sonner({ title: 'Error', type: 'error', description: 'Empty image data' })
    isPending.value = false
    return
  }

  try {
    const ext = existingFile.value
      ? existingFile.value.split('.').pop() || extFromMime(file.value.type)
      : extFromMime(file.value.type)
    const finalName = `${baseName.value}.${ext}`

    const form = new FormData()
    form.append('base', baseName.value) // важно — идёт перед файлом
    form.append('file', blob, finalName)

    const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const data = await res.json()

    existingFile.value = data.filename || finalName
    openDialog.value = false
    sonner({
      title: 'Success',
      type: 'success',
      description: existingFile.value ? 'Image replaced.' : 'Image uploaded.',
    })
    emit('uploaded', existingFile.value)
  } catch (err) {
    console.error(err)
    sonner({ title: 'Error', type: 'error', description: 'Failed to upload image' })
  } finally {
    isPending.value = false
  }
}

watch(cropPreview, () => {
  if (!cropPreview.value) return
  const img = new Image()
  img.src = cropPreview.value
  img.onload = () => {
    widthOriginal.value = img.width
  }
})
</script>

<template>
  <!-- Guest: только URL -->
  <div
    v-if="!isUser && !loadingRole"
    class="flex w-full items-center gap-2"
  >
    <input
      v-model="urlForGuest"
      type="url"
      placeholder="https://example.com/image.jpg"
      class="w-full rounded-md border px-3 py-2 outline-none focus:ring"
      @blur="emit('uploaded', urlForGuest)"
      @keydown.enter.prevent="emit('uploaded', urlForGuest)"
    >
  </div>

  <!-- User: загрузка -->
  <div
    v-else
    class="inline-flex items-center gap-2"
  >
    <button
      class="rounded-md border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-transparent dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border-slate-200 dark:border-slate-700 disabled:opacity-50"
      :disabled="!baseName || checking || loadingRole"
      @click="onClick"
    >
      {{ buttonText }}
    </button>
    <span class="text-xs text-slate-500">
      <template v-if="loadingRole || checking">Checking…</template>
      <template v-else-if="baseName">
        File: <strong>{{ existingFile || `${baseName}.*` }}</strong>
      </template>
      <template v-else>Fill the Full Name first</template>
    </span>

    <!-- Модалка кадрирования -->
    <div
      v-if="openDialog"
      class="fixed inset-0 z-[99990] flex items-center justify-center p-4"
    >
      <!-- overlay -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <!-- panel -->
      <div
        class="relative z-[99991] w-full max-w-2xl rounded-xl border p-6 shadow-lg bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
      >
        <div class="mb-3">
          <h3 class="text-lg font-semibold">
            Upload Image
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Crop image and upload. The file name is auto-derived from your Full Name.
          </p>
        </div>

        <div class="grid grid-cols-[3fr_1fr] gap-4 overflow-hidden">
          <div class="relative max-h-[250px] min-h-[200px] bg-white dark:bg-slate-800">
            <img
              ref="imageRef"
              :src="cropPreview"
              alt="crop-preview"
              class="max-h-[250px]"
            >
          </div>
          <div class="flex flex-col items-center gap-2">
            <img
              :src="croppedPreview"
              alt="cropped"
              class="size-36 rounded-md border object-contain border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Preview
            </p>
          </div>
        </div>

        <div class="mt-4 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium">Aspect Ratio</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ratio in aspectRatios"
                :key="ratio.label"
                class="rounded-md border px-2 py-1 text-sm border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                @click="setAspectRatio(ratio.value as unknown as AcceptableValue)"
              >
                {{ ratio.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">
              Resize to
              <span class="text-slate-500 dark:text-slate-400">(Original: {{ widthOriginal ?? '—' }}px)</span>
            </label>
            <input
              v-model.number="widthResized"
              type="number"
              min="1"
              class="w-24 rounded-md border px-2 py-1 outline-none focus:ring bg-white text-slate-900 border-slate-200 placeholder-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
            >
          </div>

          <div class="flex justify-end gap-2">
            <button
              class="rounded-md border px-3 py-2 text-sm border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              @click="openDialog = false"
            >
              Cancel
            </button>
            <button
              class="rounded-md px-3 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
              :disabled="isPending"
              @click="uploadImage"
            >
              {{ buttonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
