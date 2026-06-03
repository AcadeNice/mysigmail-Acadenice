/*
   - For guests, the "banner" addon is filtered out from all templates/defaults.
*/
import type {
  AddonTool,
  BasicTool,
  OptionsTool,
  Signature,
  SocialTool,
} from '@/composables/signatures/types'

import { useAccess } from '@/composables/useAccess'

// Absolute URL so the banner resolves in mail clients (relative paths break in Gmail/Outlook)
const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin

export interface Template extends Signature {
  preview?: string
  isNew?: boolean
}

export function useTemplateData() {
  const { isUser } = useAccess()

  // Palette: azur/mediterranean blues + soft neutrals
  const BRAND = {
    main: '#4CCCB8', // primary azur
    secondary: '#FDA100', // AcadéNice orange
    bg: '#0F2F4A', // deep night blue
    textOnBg: '#FFFFFF',
    font: 'Inter, Segoe UI, Arial, Helvetica, sans-serif',
  }

  const DEFAULTS = {
    basic: [
      { id: 'avatar', label: 'Avatar', type: 'image', main: true, value: '' },
      { id: 'full-name', label: 'Nom complet', type: 'text', main: true, value: 'Nom Prénom' },
      {
        id: 'job-title',
        label: 'Intitulé du poste',
        type: 'text',
        main: true,
        value: 'Enseignant',
      },
      { id: 'organization', label: 'Entreprise', type: 'text', main: true, value: 'AcadéNice' },
      { id: 'website-link', label: 'Site web', type: 'link', main: true, value: 'https://acadenice.fr' },
      {
        id: 'email-address',
        label: 'Email',
        type: 'email',
        main: true,
        value: 'prenom.nom@acadenice.fr',
      },
      {
        id: 'phone-mobile',
        label: 'Standard',
        type: 'phone',
        main: true,
        value: '04 23 50 02 70',
      },
      { id: 'phone-standard', label: 'Poste', type: 'text', main: true, value: '10X' },
      {
        id: 'appointment-link',
        label: 'Prendre rendez-vous',
        type: 'link',
        main: true,
        value: 'https://cal.acadenice.com/prénom/rdv',
      },
    ] as BasicTool[],

    options: {
      mainColor: BRAND.main,
      secondaryColor: BRAND.secondary,
      bgColor: BRAND.bg,
      bgTextColor: BRAND.textOnBg,
      avatar: true,
      avatarSize: 112,
      avatarShape: 'rounded-corner',
      fontFamily: BRAND.font,
      fontSize: 12,
      jobSeparator: '/',
    } as OptionsTool,

    addons: [
      {
        label: 'Banner',
        type: 'banner',
        isNew: false,
        value: {
          image: `${publicBase}/assets/acadenice-banniere.png`,
          link: 'https://acadenice.fr',
        },
      },
    ] as AddonTool[],

    socials: [
      { icon: 'facebook', value: 'https://facebook.com/acadenice', label: 'Facebook' },
      { icon: 'twitter', value: 'https://x.com/acadenice', label: 'Twitter' },
      { icon: 'linkedin', value: 'https://linkedin.com/school/acadenice', label: 'LinkedIn' },
      { icon: 'instagram', value: 'https://instagram.com/acadenice', label: 'Instagram' },
      { icon: 'tiktok', value: 'https://www.tiktok.com/@acadenice', label: 'TikTok' },
      { icon: 'youtube', value: 'https://www.youtube.com/@AcadéNice', label: 'YouTube' },
    ] as SocialTool[],
  }

  // Role-based addons: guests get NO banner at all
  const addonsForRole = isUser.value
    ? DEFAULTS.addons
    : DEFAULTS.addons.filter((a) => a.type !== 'banner')

  const templates: Template[] = [
    {
      name: 'SignatureTemplate1',
      label: 'Template #1',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: DEFAULTS.options,
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-1.png',
    },
    {
      name: 'SignatureTemplate8',
      label: 'Template #8',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: DEFAULTS.options,
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-8.png',
    },
    {
      name: 'SignatureTemplate2',
      label: 'Template #2',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: { ...DEFAULTS.options, avatarSize: 96, jobSeparator: 'br', column1Width: 20 },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-2.png',
    },
    {
      name: 'SignatureTemplate3',
      label: 'Template #3',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: { ...DEFAULTS.options, avatarSize: 86, jobSeparator: 'br' },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-3.png',
    },
    {
      name: 'SignatureTemplate4',
      label: 'Template #4',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: { ...DEFAULTS.options, avatarSize: 94, jobSeparator: 'br' },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-4.png',
    },
    {
      name: 'SignatureTemplate5',
      label: 'Template #5',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: { ...DEFAULTS.options, avatarSize: 94, jobSeparator: 'br', column1Width: 20 },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-5.png',
    },
    {
      name: 'SignatureTemplate6',
      label: 'Template #6',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: {
          ...DEFAULTS.options,
          mainColor: BRAND.bg,
          secondaryColor: BRAND.secondary,
          bgColor: BRAND.bg,
          bgTextColor: BRAND.textOnBg,
          avatarSize: 74,
          jobSeparator: 'br',
        },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-6.png',
    },
    {
      name: 'SignatureTemplate7',
      label: 'Template #7',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: {
          ...DEFAULTS.options,
          mainColor: '#4F86C6',
          bgColor: BRAND.bg,
          bgTextColor: BRAND.textOnBg,
          avatarSize: 68,
          avatarShape: 'round',
          jobSeparator: '/',
        },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-7.png',
    },
    {
      name: 'SignatureTemplate9',
      label: 'Template #9',
      isNew: false,
      tools: {
        basic: DEFAULTS.basic,
        options: { ...DEFAULTS.options, avatarSize: 96 },
        addons: addonsForRole,
        socials: DEFAULTS.socials,
      },
      preview: 'template-9.png',
    },
  ]

  return {
    templates,
    // Expose DEFAULTS with role-based addons so downstream UIs also see no banner for guests
    DEFAULTS: { ...DEFAULTS, addons: addonsForRole },
  }
}
