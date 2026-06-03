<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useSignatures } from '@/composables/signatures/useSignatures'
import { useAccess } from '@/composables/useAccess'
import { useSonner } from '@/composables/useSonner'

const { getBannerEffective, patchBannerEffective } = useSignatures()
const { isUser, loadingRole } = useAccess()
const { sonner } = useSonner()

const isHttp = (v: string) => /^https?:\/\/\S+/i.test(v.trim())
const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin
const serverBannerUrl = `${publicBase}/assets/acadenice-banniere.png`

interface BannerInfo {
  exists: boolean
  hidden: boolean
  mtime: number
  path: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const info = ref<BannerInfo>({
  exists: false,
  hidden: false,
  mtime: 0,
  path: '/assets/acadenice-banniere.png',
})
const checking = ref(false)
const uploading = ref(false)
const toggling = ref(false)

const image = computed<string>({
  get: () => getBannerEffective().image,
  set: (value) => {
    const raw = (value ?? '').trim()
    const next = !raw ? '' : isHttp(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`
    patchBannerEffective('image', next)
  },
})

const link = computed<string>({
  get: () => getBannerEffective().link,
  set: (v) => patchBannerEffective('link', (v ?? '').trim()),
})

async function refreshInfo() {
  checking.value = true
  try {
    const res = await fetch('/api/banner-info', { credentials: 'include' })
    if (!res.ok) throw new Error(`banner-info-${res.status}`)
    info.value = await res.json()
  } catch {
    info.value = {
      exists: false,
      hidden: false,
      mtime: 0,
      path: '/assets/acadenice-banniere.png',
    }
  } finally {
    checking.value = false
  }
}

function selectBannerFile() {
  if (!isUser.value || uploading.value) return
  fileInput.value?.click()
}

function fileToPng(file: File): Promise<Blob> {
  if (file.type === 'image/png') return Promise.resolve(file)

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas-unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('empty-png'))
        else resolve(blob)
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-load-failed'))
    }
    img.src = url
  })
}

async function onBannerSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !isUser.value) return

  uploading.value = true
  try {
    const png = await fileToPng(file)
    const form = new FormData()
    form.append('file', png, 'acadenice-banniere.png')

    const res = await fetch('/api/banner-upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.ok !== true) {
      throw new Error(data?.error || `banner-upload-${res.status}`)
    }

    info.value = data
    image.value = serverBannerUrl
    sonner({
      title: 'Bannière remplacée',
      type: 'success',
      description: 'Le fichier public a été remplacé à la même URL.',
    })
  } catch (e: any) {
    sonner({
      title: 'Erreur',
      type: 'error',
      description: e?.message || 'Impossible de remplacer la bannière.',
    })
  } finally {
    uploading.value = false
  }
}

async function setBannerHidden(hidden: boolean) {
  if (!isUser.value || toggling.value) return
  toggling.value = true
  try {
    const res = await fetch('/api/banner-visibility', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.ok !== true) {
      throw new Error(data?.error || `banner-visibility-${res.status}`)
    }

    info.value = data
    image.value = serverBannerUrl
    sonner({
      title: hidden ? 'Bannière cachée' : 'Bannière restaurée',
      type: 'success',
      description: hidden
        ? 'Le fichier public est maintenant un pixel transparent.'
        : 'La bannière précédente a été remise à la même URL.',
    })
  } catch (e: any) {
    sonner({
      title: 'Erreur',
      type: 'error',
      description: e?.message || 'Impossible de modifier la visibilité de la bannière.',
    })
  } finally {
    toggling.value = false
  }
}

onMounted(refreshInfo)
</script>

<template>
  <UiFieldForm>
    <UiFieldFormItem
      label="URL de l'image"
      description="Collez un lien public vers l’image. Laissez vide pour utiliser la bannière AcadéNice par défaut."
    >
      <UiInput
        v-model="image"
        placeholder="https://sign.acadenice.com/assets/acadenice-banniere.png"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
      />
      <p class="mt-1 text-[12px] text-muted-foreground">
        Formats courants (PNG/JPG/GIF). Les liens Google Drive/SharePoint privés peuvent ne pas
        s’afficher.
      </p>
    </UiFieldFormItem>

    <UiFieldFormItem
      label="Bannière globale"
      description="Ces actions remplacent le fichier public utilisé par les signatures déjà envoyées."
    >
      <div class="grid gap-3">
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          @change="onBannerSelected"
        >

        <div class="flex flex-wrap items-center gap-2">
          <UiButton
            type="button"
            variant="outline"
            :disabled="!isUser || loadingRole || uploading"
            @click="selectBannerFile"
          >
            {{ uploading ? 'Remplacement…' : 'Remplacer la bannière' }}
          </UiButton>
          <span class="text-xs text-muted-foreground">
            URL publique : <strong>/assets/acadenice-banniere.png</strong>
          </span>
        </div>

        <div class="flex items-center gap-3 rounded-md border p-3">
          <UiSwitch
            :model-value="info.hidden"
            :disabled="!isUser || loadingRole || checking || toggling"
            @update:model-value="setBannerHidden(Boolean($event))"
          />
          <div class="grid gap-0.5">
            <span class="text-sm font-medium">Cacher la bannière temporairement</span>
            <span class="text-xs text-muted-foreground">
              {{ info.hidden
                ? 'Le fichier public est un pixel transparent. Désactivez pour restaurer la bannière précédente.'
                : 'Le fichier actuel sera déplacé en acadenice-banniere-hide.png puis remplacé par un pixel transparent.' }}
            </span>
          </div>
        </div>

        <p
          v-if="!isUser && !loadingRole"
          class="text-xs text-muted-foreground"
        >
          Connectez-vous via l’accès réservé pour remplacer ou cacher la bannière globale.
        </p>
      </div>
    </UiFieldFormItem>

    <UiFieldFormItem label="Lien">
      <UiInput
        v-model="link"
        placeholder="https://acadenice.fr"
      />
    </UiFieldFormItem>
  </UiFieldForm>
</template>
