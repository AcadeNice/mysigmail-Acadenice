import { useStorage } from '@vueuse/core'
/* Strict guest-safe signatures store.
   - Guests cannot change server-side "banner" or "trackingPixel" addons.
   - Guests get a local guestBanner override stored in localStorage.
   - JSON import for guests auto-strips the "banner" and "trackingPixel" addons.
*/
import { computed, ref, watch } from 'vue'

import { useAccess } from '@/composables/useAccess'
import { useSonner } from '@/composables/useSonner'
import { useTemplateData } from '@/data/templates'
import { clone } from '@/utils'

import type {
  Addon,
  AddonBanner,
  AddonTrackingPixel,
  AddonValue,
  BasicTool,
  Signature,
  Social,
} from './types'

const { sonner } = useSonner()
const { templates } = useTemplateData()
const { isUser } = useAccess()

const isInit = ref(false)

const selectedIdStore = useStorage('selected-signature-id', '')
const unsavedSignatureStore = useStorage('unsaved-signature', '')

/** ========= reactive base ========= */
const selectedId = ref<string>()
const installed = ref<Signature>(templates[0])

/** ========= basic ========= */
const mainFields = computed(() => installed.value.tools.basic.filter((i) => i.type !== 'image'))
const signatureMainFields = computed(() => mainFields.value.filter((i) => !i.inlineWith))
const isMainFieldsEmpty = computed(() => mainFields.value.every((i) => !i.value))
const imageField = computed(() => installed.value.tools.basic.find((i) => i.type === 'image')?.value ?? '')
const defaultMainFields = computed(() => templates[0].tools.basic.filter((i) => i.type !== 'image'))

function normalizeLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
}

function sameLabel(field: BasicTool, label: string) {
  return normalizeLabel(field.label) === normalizeLabel(label)
}

function normalizeColor(color: string | undefined) {
  return color?.trim().toUpperCase()
}

function findField(basic: BasicTool[], id: string, label: string) {
  return basic.find((field) => field.id === id) ?? basic.find((field) => sameLabel(field, label))
}

function ensureCoreFieldIds(signature: Signature) {
  const basic = signature.tools.basic
  const coreFields = [
    { id: 'avatar', label: 'Avatar' },
    { id: 'full-name', label: 'Nom complet' },
    { id: 'job-title', label: 'Intitulé du poste' },
    { id: 'organization', label: 'Entreprise' },
    { id: 'website-link', label: 'Site web', aliases: ['Website'] },
    { id: 'email-address', label: 'Email' },
  ]

  coreFields.forEach(({ id, label, aliases = [] }) => {
    const field = findField(basic, id, label) ?? aliases.map((alias) => findField(basic, '', alias)).find(Boolean)
    if (!field) return

    field.id = id
    if (aliases.some((alias) => sameLabel(field, alias))) {
      field.label = label
    }
  })
}

function ensureField(signature: Signature, fieldDefaults: BasicTool) {
  const basic = signature.tools.basic
  let field = findField(basic, fieldDefaults.id ?? '', fieldDefaults.label)

  if (!field) {
    field = clone(fieldDefaults)
    basic.push(field)
  }

  field.id = fieldDefaults.id
  field.main = fieldDefaults.main
  field.type = fieldDefaults.type

  return field
}

function moveAfter(basic: BasicTool[], field: BasicTool | undefined, anchor: BasicTool | undefined) {
  if (!field) return

  const currentIndex = basic.indexOf(field)
  if (currentIndex < 0) return

  basic.splice(currentIndex, 1)

  const anchorIndex = anchor ? basic.indexOf(anchor) : -1
  basic.splice(anchorIndex >= 0 ? anchorIndex + 1 : basic.length, 0, field)
}

function ensureContactFields(signature: Signature) {
  const basic = signature.tools.basic
  const email = findField(basic, '', 'Email')
  const appointment = ensureField(signature, {
    id: 'appointment-link',
    label: 'Prendre RDV',
    main: true,
    type: 'link',
    value: '',
  })
  const mobile = ensureField(signature, {
    id: 'phone-mobile',
    label: 'Portable',
    main: true,
    type: 'phone',
    value: '',
  })
  const standard = ensureField(signature, {
    id: 'phone-standard',
    label: 'Standard',
    main: true,
    type: 'phone',
    value: '',
  })

  moveAfter(basic, appointment, email)
  moveAfter(basic, mobile, appointment)
  moveAfter(basic, standard, mobile)
}

function ensureDefaultOptionColors(signature: Signature) {
  const options = signature.tools.options
  const oldDefault = '#4CCCB8'
  const nextSecondary = '#FDA100'

  if (
    !options.secondaryColor
    || (
      normalizeColor(options.mainColor) === oldDefault
      && normalizeColor(options.secondaryColor) === oldDefault
    )
  ) {
    options.secondaryColor = nextSecondary
  }
}

function ensureSignatureFields(signature: Signature) {
  ensureCoreFieldIds(signature)
  ensureContactFields(signature)
  ensureDefaultOptionColors(signature)
}

const nameField = computed(() => {
  if (isMainFieldsEmpty.value) return defaultMainFields.value[0]
  return signatureMainFields.value[0]
})

const jobFields = computed(() => {
  if (isMainFieldsEmpty.value) return defaultMainFields.value.slice(1, 3)
  return signatureMainFields.value.slice(1, 3)
})

const otherFields = computed(() => {
  if (isMainFieldsEmpty.value) return defaultMainFields.value.slice(3)
  return signatureMainFields.value.slice(3)
})

function inlineFieldsFor(field: BasicTool) {
  if (!field.id) return []
  return mainFields.value.filter((i) => i.inlineWith === field.id && i.value)
}

const options = computed(() => installed.value.tools.options)

const fontBase = computed(() => ({
  fontSize: `${options.value.fontSize}px`,
  fontFamily: options.value.fontFamily,
  margin: '0',
  lineHeight: '150%',
}))

const fontAccent = computed(() => ({
  ...fontBase.value,
  fontSize: options.value && `${options.value.fontSize + 2}px`,
}))

const addons = computed(() => installed.value.tools.addons || [])
const socials = computed(() => installed.value.tools.socials || [])

const isImageFieldEmpty = computed(() => !imageField.value)
const isSocialsEmpty = computed(() => !socials.value.length)
const isAddonsEmpty = computed(() => !addons.value.length)

const isBgColorAvailable = computed(() => {
  const available = ['SignatureTemplate6', 'SignatureTemplate7']
  return available.includes(installed.value.name)
})

const isSecondColorAvailable = computed(() => {
  const available = [
    'SignatureTemplate1',
    'SignatureTemplate2',
    'SignatureTemplate3',
    'SignatureTemplate4',
    'SignatureTemplate5',
    'SignatureTemplate6',
    'SignatureTemplate8',
    'SignatureTemplate9',
  ]
  return available.includes(installed.value.name)
})

const isColumnSizeAvailable = computed(() => {
  const available = ['SignatureTemplate2', 'SignatureTemplate5']
  return available.includes(installed.value.name)
})

/** ========= addon util ========= */
function isAddonTool(type: Addon) {
  return installed.value.tools.addons.some((i) => i.type === type)
}

function isOnlyAddon(type: Addon) {
  return installed.value.tools.addons.findIndex((i) => i.type === type) > -1
}

function getAddonValue<T extends AddonValue>(type: Addon): T {
  return installed.value.tools.addons.find((i) => i.type === type)?.value as T
}

/** Guests must not directly set server-side banner or trackingPixel */
function setAddonValue<T extends AddonValue>(type: Addon, value: T) {
  if (!isUser.value && (type === 'banner' || type === 'trackingPixel')) return
  const addon = addons.value.find((i) => i.type === type)
  if (addon) addon.value = value
}

/** Guests must not directly patch server-side banner or trackingPixel */
function patchAddonValue<T extends AddonValue>(type: Addon, key: keyof T, value: T[keyof T]) {
  if (!isUser.value && (type === 'banner' || type === 'trackingPixel')) return
  const addon = addons.value.find((i) => i.type === type)
  if (addon) {
    ;(addon.value as Record<string, any>)[key as string] = value
  }
}

function getSocialValue(type: Social) {
  return socials.value.find((i) => i.icon === type)?.value
}

function setSocialValue(type: Social, value: string) {
  const social = socials.value.find((i) => i.icon === type)
  if (social) social.value = value
}

/** ========= templates ========= */
function resetInstalledToDefault() {
  installed.value = clone(templates[0])
  ensureSignatureFields(installed.value)
  installed.value.tools.basic.forEach((i) => (i.value = ''))
}

function setTemplate(signature: Signature) {
  ensureSignatureFields(installed.value)
  installed.value.name = signature.name
  installed.value.label = signature.label

  installed.value.tools.options.avatarSize = signature.tools.options.avatarSize
  installed.value.tools.options.avatarShape = signature.tools.options.avatarShape

  if (!installed.value.tools.options.bgColor) {
    installed.value.tools.options.bgColor = signature.tools.options.bgColor
    installed.value.tools.options.bgTextColor = signature.tools.options.bgTextColor
  }

  if (!installed.value.tools.options.column1Width) {
    installed.value.tools.options.column1Width = signature.tools.options.column1Width
  }
}

/** ========= Экспорт/импорт ========= */
function downloadJSON(signature: Signature) {
  const data = JSON.stringify(signature)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'acadenice-signature.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** Guests: strip banner & trackingPixel addons from imported JSON */
function stripBannerIfGuest(sig: Signature) {
  if (isUser.value) return sig
  return {
    ...sig,
    tools: {
      ...sig.tools,
      addons: (sig.tools.addons || []).filter(
        (a) => a.type !== 'banner' && a.type !== 'trackingPixel',
      ),
    },
  } as Signature
}

async function uploadJSON(json: string) {
  let data: any
  try {
    data = JSON.parse(json)
  } catch {
    sonner({ title: 'Invalid JSON format', type: 'error' })
    throw new Error('Invalid JSON format')
  }

  if (typeof data !== 'object' || data === null) {
    sonner({ title: 'Invalid signature: not an object', type: 'error' })
    throw new Error('Invalid signature: not an object')
  }

  if (typeof data.label !== 'string' || typeof data.name !== 'string') {
    sonner({ title: 'Invalid signature: missing or invalid label/name', type: 'error' })
    throw new Error('Invalid signature: missing or invalid label/name')
  }

  if (!data.tools || typeof data.tools !== 'object') {
    sonner({ title: 'Invalid signature: missing tools', type: 'error' })
    throw new Error('Invalid signature: missing tools')
  }

  if (
    !Array.isArray(data.tools.addons)
    || !Array.isArray(data.tools.basic)
    || !Array.isArray(data.tools.socials)
  ) {
    sonner({ title: 'Invalid signature: tools arrays are invalid', type: 'error' })
    throw new Error('Invalid signature: tools arrays are invalid')
  }

  if (typeof data.tools.options !== 'object' || data.tools.options === null) {
    sonner({ title: 'Invalid signature: options is invalid', type: 'error' })
    throw new Error('Invalid signature: options is invalid')
  }

  installed.value = stripBannerIfGuest(data as Signature)
  ensureSignatureFields(installed.value)
}

/** ========= init / autosave ========= */
function init() {
  if (isInit.value) return
  isInit.value = true

  const unsavedSignature = unsavedSignatureStore.value
  if (!unsavedSignature) {
    ensureSignatureFields(installed.value)
    return
  }

  try {
    const data = JSON.parse(unsavedSignature) as Signature
    installed.value = stripBannerIfGuest(data)
    ensureSignatureFields(installed.value)
    // unsavedSignatureStore.value = ''
  } catch (err) {
    console.error(err)
    resetInstalledToDefault()
  }
}

watch(installed, () => (unsavedSignatureStore.value = JSON.stringify(installed.value)), {
  deep: true,
})

/** ========= guest banner ========= */
interface GuestBanner {
  image: string
  link: string
  width: number
}
const guestBanner = useStorage<GuestBanner>('guest-banner', {
  image: '',
  link: '',
  width: 100,
})

function getBannerEffective(): AddonBanner {
  if (isUser.value) {
    return (getAddonValue<AddonBanner>('banner') ?? {
      image: '',
      link: '',
      width: 100,
    }) as AddonBanner
  }
  return guestBanner.value as AddonBanner
}

function patchBannerEffective<K extends keyof AddonBanner>(key: K, value: AddonBanner[K]) {
  if (isUser.value) {
    patchAddonValue<AddonBanner>('banner', key, value)
  } else {
    ;(guestBanner.value as any)[key as string] = value
  }
}

function getTrackingPixelEffective(): AddonTrackingPixel {
  const v = getAddonValue<AddonTrackingPixel>('trackingPixel')
  if (!v || typeof v !== 'object') return { url: '', enabled: false }
  if (!isUser.value) return { url: '', enabled: false }
  const url = (v.url ?? '').toString().trim()
  const enabled = Boolean(v.enabled && url)
  return { url, enabled }
}

/** ========= store export ========= */
export function useSignatures() {
  return {
    addons,
    downloadJSON,
    fontAccent,
    fontBase,
    getAddonValue,
    getSocialValue,
    imageField,
    inlineFieldsFor,
    init,
    installed,
    isAddonsEmpty,
    isAddonTool,
    isBgColorAvailable,
    isColumnSizeAvailable,
    isImageFieldEmpty,
    isInit,
    isMainFieldsEmpty,
    isOnlyAddon,
    isSecondColorAvailable,
    isSocialsEmpty,
    jobFields,
    mainFields,
    nameField,
    options,
    otherFields,
    patchAddonValue,
    resetInstalledToDefault,
    selectedId,
    selectedIdStore,
    setAddonValue,
    setSocialValue,
    setTemplate,
    socials,
    uploadJSON,

    // banner
    getBannerEffective,
    patchBannerEffective,
    guestBanner,

    // pixel
    getTrackingPixelEffective,
  }
}
