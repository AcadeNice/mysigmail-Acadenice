import { useStorage } from '@vueuse/core'
/* Strict guest-safe signatures store.
   - Guests cannot change server-side "banner" or "trackingPixel" addons.
   - Guests get a local guestBanner override stored in localStorage.
   - JSON import for guests auto-strips the "banner" and "trackingPixel" addons.
*/
import { computed, ref, watch } from 'vue'

import { useAccess } from '@/composables/useAccess'
import { useSonner } from '@/composables/useSonner'
import { disclaimerPresets } from '@/data/disclaimer-pressets'
import { useTemplateData } from '@/data/templates'
import { clone } from '@/utils'

import type {
  Addon,
  AddonBanner,
  AddonCTA,
  AddonDisclaimer,
  AddonLogo,
  AddonTrackingPixel,
  AddonValue,
  AddonVideoConference,
  BasicTool,
  Signature,
  Social,
  SocialTool,
} from './types'

const { sonner } = useSonner()
const { templates } = useTemplateData()
const { isUser } = useAccess()

const isInit = ref(false)

const selectedIdStore = useStorage('selected-signature-id', '')
const unsavedSignatureStore = useStorage('unsaved-signature', '')

const OLD_DEFAULT_DISCLAIMER = 'The contents of this email and any attachments are confidential. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.'
const OLD_DEFAULT_CTA = {
  text: 'Get your coupon for a 20% discount',
  link: 'https://example.com',
  colorBg: '#ffa500',
}
const NEXT_DEFAULT_CTA = {
  label: 'Appel à l\'Action',
  text: '🎓 AcadéNice forme les futurs talents',
  link: 'https://acadenice.fr',
  colorBg: '#FDA100',
}
const OLD_DEFAULT_VIDEO_CONFERENCE = {
  type: 'hangouts',
  text: 'Meet me on Google Hangouts',
  link: '',
} as const
const NEXT_DEFAULT_VIDEO_CONFERENCE = {
  label: 'Vidéoconférence',
  type: 'zoom',
  text: 'Me rejoindre sur Zoom',
  link: '',
} as const
const DEFAULT_MOBILE_APP_LABEL = 'Application mobile'
const DEFAULT_DISCLAIMER_LABEL = 'Clause de confidentialité'
const DEFAULT_LOGO = {
  image: `${window.location.origin}/assets/logo-acadenice.png`,
  link: 'https://acadenice.fr',
}
const DEFAULT_BANNER = {
  label: 'Bannière',
  image: `${window.location.origin}/assets/acadenice-banniere.png`,
  link: 'https://acadenice.fr',
}
const OLD_DEFAULT_AVATAR_SIZE = 112
const NEXT_DEFAULT_AVATAR_SIZE = 158

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
    { id: 'website-link', label: 'Site', aliases: ['Site web', 'Website'] },
    { id: 'email-address', label: 'Email' },
  ]

  coreFields.forEach(({ aliases = [], id, label }) => {
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
  const oldAppointment = findField(basic, '', 'Prendre RDV')
  if (oldAppointment && !oldAppointment.id) {
    oldAppointment.id = 'appointment-link'
  }

  const appointment = ensureField(signature, {
    id: 'appointment-link',
    label: 'Prendre rendez-vous',
    main: true,
    type: 'link',
    value: 'https://cal.acadenice.com/prénom/rdv',
  })
  const mobile = ensureField(signature, {
    id: 'phone-mobile',
    label: 'Standard',
    main: true,
    type: 'phone',
    value: '04 23 50 02 70',
  })
  const standard = ensureField(signature, {
    id: 'phone-standard',
    label: 'Poste',
    main: true,
    type: 'text',
    value: '10X',
  })

  if (!appointment.label || sameLabel(appointment, 'Prendre RDV')) {
    appointment.label = 'Prendre rendez-vous'
  }

  if (!appointment.value) {
    appointment.value = 'https://cal.acadenice.com/prénom/rdv'
  }

  if (!mobile.label || sameLabel(mobile, 'Portable')) {
    mobile.label = 'Standard'
  }

  if (!mobile.value) {
    mobile.value = '04 23 50 02 70'
  }

  if (!standard.label || sameLabel(standard, 'Standard')) {
    standard.label = 'Poste'
  }

  if (!standard.value) {
    standard.value = '10X'
  }

  if (email && (!email.value || email.value === 'prenom.nom@acadenice.fr')) {
    email.value = 'prenom@acadenice.fr'
  }

  moveAfter(basic, mobile, email)
  moveAfter(basic, standard, mobile)
  moveAfter(basic, appointment, standard)
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

function ensureDefaultAvatarSize(signature: Signature) {
  const options = signature.tools.options
  if (!options.avatarSize || (signature.name === 'SignatureTemplate1' && options.avatarSize === OLD_DEFAULT_AVATAR_SIZE)) {
    options.avatarSize = NEXT_DEFAULT_AVATAR_SIZE
  }
}

function ensureDefaultSocials(signature: Signature) {
  signature.tools.socials = signature.tools.socials.filter((social) => {
    const normalizedValue = social.value
      .trim()
      .replace(/^https?:\/\/(www\.)?/i, '')
      .replace(/\/$/, '')
      .toLowerCase()

    return !(social.icon === 'twitter' && normalizedValue === 'x.com/acadenice')
  })

  const requiredSocials: SocialTool[] = [
    {
      icon: 'tiktok',
      label: 'TikTok',
      value: 'https://www.tiktok.com/@acadenice',
    },
    {
      icon: 'youtube',
      label: 'YouTube',
      value: 'https://www.youtube.com/@AcadéNice',
    },
  ]

  requiredSocials.forEach((requiredSocial) => {
    const exists = signature.tools.socials.some((social) => social.icon === requiredSocial.icon)
    if (!exists) signature.tools.socials.push(requiredSocial)
  })
}

function ensureDefaultDisclaimer(signature: Signature) {
  const disclaimer = signature.tools.addons.find((addon) => addon.type === 'disclaimer')
  if (!disclaimer) return

  disclaimer.label = DEFAULT_DISCLAIMER_LABEL

  if (typeof disclaimer.value === 'string') {
    const text = disclaimer.value.trim() === OLD_DEFAULT_DISCLAIMER
      ? disclaimerPresets[0].value
      : disclaimer.value

    disclaimer.value = {
      text,
      fontSize: 12,
    }
    return
  }

  if (typeof disclaimer.value !== 'object' || disclaimer.value === null || Array.isArray(disclaimer.value)) return

  const value = disclaimer.value as AddonDisclaimer
  if (!value.text || value.text.trim() === OLD_DEFAULT_DISCLAIMER) {
    value.text = disclaimerPresets[0].value
  }
  if (!value.fontSize) {
    value.fontSize = 12
  }
  delete (value as { fullWidth?: boolean }).fullWidth
}

function ensureDefaultCta(signature: Signature) {
  const cta = signature.tools.addons.find((addon) => addon.type === 'cta')
  if (!cta || typeof cta.value !== 'object' || cta.value === null || Array.isArray(cta.value)) return

  cta.label = NEXT_DEFAULT_CTA.label

  const value = cta.value as AddonCTA
  if (value.text === OLD_DEFAULT_CTA.text) value.text = NEXT_DEFAULT_CTA.text
  if (value.link === OLD_DEFAULT_CTA.link) value.link = NEXT_DEFAULT_CTA.link
  if (normalizeColor(value.colorBg) === normalizeColor(OLD_DEFAULT_CTA.colorBg)) {
    value.colorBg = NEXT_DEFAULT_CTA.colorBg
  }
}

function ensureDefaultVideoConference(signature: Signature) {
  const videoConference = signature.tools.addons.find((addon) => addon.type === 'videoConference')
  if (
    !videoConference
    || typeof videoConference.value !== 'object'
    || videoConference.value === null
    || Array.isArray(videoConference.value)
  ) { return
  }

  videoConference.label = NEXT_DEFAULT_VIDEO_CONFERENCE.label

  const value = videoConference.value as AddonVideoConference
  const legacyType = value.type as AddonVideoConference['type'] | 'google-meet' | 'hangouts'
  if (legacyType === OLD_DEFAULT_VIDEO_CONFERENCE.type || legacyType === 'google-meet') {
    value.type = NEXT_DEFAULT_VIDEO_CONFERENCE.type
  }
  if (
    value.text === OLD_DEFAULT_VIDEO_CONFERENCE.text
    || value.text === 'Me rejoindre sur Google Meet'
  ) {
    value.text = NEXT_DEFAULT_VIDEO_CONFERENCE.text
  }
  if (
    value.link === OLD_DEFAULT_VIDEO_CONFERENCE.link
    || value.link === 'https://meet.google.com/'
    || value.link === 'https://meet.google.com/calling/'
  ) {
    value.link = NEXT_DEFAULT_VIDEO_CONFERENCE.link
  }
}

function ensureDefaultBanner(signature: Signature) {
  const banner = signature.tools.addons.find((addon) => addon.type === 'banner')
  if (!banner || typeof banner.value !== 'object' || banner.value === null || Array.isArray(banner.value)) return

  banner.label = DEFAULT_BANNER.label

  const value = banner.value as AddonBanner
  if (!value.image || value.image.endsWith('/assets/acadenice-banner.png')) {
    value.image = DEFAULT_BANNER.image
  }
  if (!value.link) value.link = DEFAULT_BANNER.link
  delete (value as Partial<AddonBanner>).width
}

function ensureDefaultMobileApp(signature: Signature) {
  const mobileApp = signature.tools.addons.find((addon) => addon.type === 'mobileApp')
  if (mobileApp) mobileApp.label = DEFAULT_MOBILE_APP_LABEL
}

function ensureDefaultLogo(signature: Signature) {
  const logo = signature.tools.addons.find((addon) => addon.type === 'logo')
  if (!logo || typeof logo.value !== 'object' || logo.value === null || Array.isArray(logo.value)) return

  const value = logo.value as AddonLogo
  if (!value.image) value.image = DEFAULT_LOGO.image
  if (!value.link) value.link = DEFAULT_LOGO.link
}

function ensureSignatureFields(signature: Signature) {
  ensureCoreFieldIds(signature)
  ensureContactFields(signature)
  ensureDefaultOptionColors(signature)
  ensureDefaultAvatarSize(signature)
  ensureDefaultSocials(signature)
  ensureDefaultDisclaimer(signature)
  ensureDefaultCta(signature)
  ensureDefaultVideoConference(signature)
  ensureDefaultBanner(signature)
  ensureDefaultMobileApp(signature)
  ensureDefaultLogo(signature)
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
