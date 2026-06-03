import type { VideoConference } from '@/composables/signatures/types'

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function normalizeUrl(link: string) {
  const re = /^(?:https?:|skype:|tg:|whatsapp:|zoommtg:|zoomus:)/i
  let url

  if (re.test(link)) {
    url = link
  } else {
    url = `https://${link}`
  }

  return url
}

export function buildVideoConferenceUrl(type: VideoConference, rawLink: string) {
  const link = rawLink.trim()

  if (!link) {
    if (type === 'skype') return ''
    if (type === 'zoom') return 'https://zoom.us/join'
  }

  if (/^(?:https?:|skype:|zoommtg:|zoomus:)/i.test(link)) {
    return link
  }

  if (type === 'zoom') {
    if (link.includes('@')) return 'https://zoom.us/join'

    const compact = link.replace(/\s+/g, '').replace(/^\/+/, '')
    const numericMeetingId = compact.replace(/-/g, '')

    if (/^\d{9,11}$/.test(numericMeetingId)) {
      return `https://zoom.us/j/${numericMeetingId}`
    }

    const personalLink = compact.replace(/^my\//i, '')
    return `https://zoom.us/my/${encodeURIComponent(personalLink)}`
  }

  if (type === 'skype') {
    const participants = link
      .split(';')
      .map((participant) => participant.trim().replace(/\s+/g, ''))
      .filter(Boolean)

    if (!participants.length) return ''

    return `skype:${participants.join(';')}?call&video=true`
  }

  return normalizeUrl(link)
}
