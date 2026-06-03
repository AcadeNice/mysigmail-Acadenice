import type { AddonTool } from '@/composables/signatures/types'

import { disclaimerPresets } from './disclaimer-pressets'

// Absolute URL so the banner resolves in mail clients (relative paths break in Gmail/Outlook)
const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL ?? window.location.origin

export const addons: AddonTool[] = [
  {
    label: 'Mobile App',
    type: 'mobileApp',
    isNew: false,
    value: {
      appStore: 'https://example.com',
      googlePlay: 'https://example.com',
    },
  },
  // {
  //   label: 'Tracking Pixel',
  //   isNew: true,
  //   value: {
  //     url: '',
  //     enabled: false,
  //     recipient: '',
  //   },
  // },
  {
    label: 'Disclaimer',
    type: 'disclaimer',
    isNew: false,
    value: {
      text: disclaimerPresets[0].value,
      fontSize: 12,
      fullWidth: false,
    },
  },
  {
    label: 'Banner',
    type: 'banner',
    isNew: false,
    value: {
      image: `${publicBase}/assets/acadenice-banniere.png`,
      link: 'https://acadenice.fr',
    },
  },
  {
    label: 'Vidéoconférence',
    type: 'videoConference',
    isNew: false,
    value: {
      type: 'google-meet',
      text: 'Me rejoindre sur Google Meet',
      link: 'https://meet.google.com/calling/',
    },
  },
  {
    label: 'Appel à l\'Action',
    type: 'cta',
    isNew: false,
    value: {
      text: '🎓 AcadéNice forme les futurs talents',
      link: 'https://acadenice.fr',
      colorBg: '#FDA100',
      colorText: '#fff',
      image: '',
      width: 50,
      type: 'text',
    },
  },
  {
    label: 'Logo',
    type: 'logo',
    isNew: false,
    value: {
      image: `${publicBase}/assets/logo-acadenice.png`,
      link: 'https://acadenice.fr',
    },
  },
]
