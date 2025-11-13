/*
   - For guests, the "banner" addon is filtered out from all templates/defaults.
*/
import { nanoid } from 'nanoid'

import type {
  AddonTool,
  BasicTool,
  OptionsTool,
  Signature,
  SocialTool,
} from '@/composables/signatures/types'

import { useAccess } from '@/composables/useAccess'

export interface Template extends Signature {
  preview?: string
  isNew?: boolean
}

export function useTemplateData() {
  const { isUser } = useAccess()

  // Palette: azur/mediterranean blues + soft neutrals
  const BRAND = {
    main: '#2A7DB8', // primary azur
    secondary: '#1F5E8A', // darker blue
    bg: '#0F2F4A', // deep night blue
    textOnBg: '#FFFFFF',
    font: 'Inter, Segoe UI, Arial, Helvetica, sans-serif',
  }

  const DEFAULTS = {
    basic: [
      { id: nanoid(8), label: 'Avatar', type: 'image', main: true, value: '' },
      { id: nanoid(8), label: 'Full Name', type: 'text', main: true, value: 'Prénom Nom' },
      {
        id: nanoid(8),
        label: 'Job Title',
        type: 'text',
        main: true,
        value: 'Enseignant · AcadéNice',
      },
      { id: nanoid(8), label: 'Company', type: 'text', main: true, value: 'AcadéNice' },
      { id: nanoid(8), label: 'Website', type: 'link', main: true, value: 'https://acadenice.fr' },
      {
        id: nanoid(8),
        label: 'Email',
        type: 'email',
        main: true,
        value: 'prenom.nom@acadenice.fr',
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
        label: 'Disclaimer',
        type: 'disclaimer',
        isNew: false,
        value:
          'CONFIDENTIALITY: This email and any attachments are intended solely for the named recipient(s) and may contain confidential information. If you are not the intended recipient, please notify the sender and delete this message.',
      },
      {
        label: 'Banner',
        type: 'banner',
        isNew: false,
        value: {
          image: '/acadenice-banner.png',
          link: 'https://acadenice.fr',
        },
      },
    ] as AddonTool[],

    socials: [
      { icon: 'facebook', value: 'https://facebook.com/acadenice', label: 'Facebook' },
      { icon: 'twitter', value: 'https://x.com/acadenice', label: 'Twitter' },
      { icon: 'linkedin', value: 'https://linkedin.com/school/acadenice', label: 'LinkedIn' },
      { icon: 'instagram', value: 'https://instagram.com/acadenice', label: 'Instagram' },
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
          secondaryColor: BRAND.bg,
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
