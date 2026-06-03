// server/gmail.ts
import { Router } from 'express'
import { google } from 'googleapis'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

/**
 * Gmail integration router. Implements:
 *   GET  /api/gmail/auth        — start OAuth
 *   GET  /api/gmail/callback    — getting Google code
 *   POST /api/gmail/signature   — signature updates
 *   POST /api/gmail/disconnect  — token deattachment
 *   GET  /api/gmail/status      — current connection status
 *
 * .env must contain:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI
 */
export const gmailRouter = Router()

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI

if (!clientId || !clientSecret || !redirectUri) {
  console.warn('[gmail] Missing Google OAuth environment variables')
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

/* ====================== tokens storage ====================== */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '.private')
fs.mkdirSync(dataDir, { recursive: true })
const tokensFile = path.join(dataDir, 'gmail-tokens.json')

const GMAIL_TOKENS_MAX_AGE_DAYS = Number(process.env.GMAIL_TOKENS_MAX_AGE_DAYS || 364)

interface GmailTokenEntry {
  email: string
  tokens: any
  ts: number
}

function readTokens(): Record<string, GmailTokenEntry> {
  try {
    if (!fs.existsSync(tokensFile)) return {}
    const raw = fs.readFileSync(tokensFile, 'utf8')
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? (obj as Record<string, GmailTokenEntry>) : {}
  } catch {
    return {}
  }
}

function writeTokens(map: Record<string, GmailTokenEntry>) {
  const tmp = `${tokensFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(map, null, 2))
  fs.renameSync(tmp, tokensFile)
}

function pruneTokens(map: Record<string, GmailTokenEntry>) {
  const now = Date.now()
  const cutoff = now - GMAIL_TOKENS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const out: Record<string, GmailTokenEntry> = {}

  for (const [email, entry] of Object.entries(map)) {
    if (typeof entry.ts === 'number' && entry.ts >= cutoff) {
      out[email] = entry
    }
  }
  return out
}

function saveGmailTokens(email: string, tokens: any) {
  const all = pruneTokens(readTokens())
  all[email] = { email, tokens, ts: Date.now() }
  writeTokens(all)
}

function getGmailTokens(email: string): any | null {
  const all = pruneTokens(readTokens())
  const entry = all[email]
  if (!entry) return null
  return entry.tokens
}

function deleteGmailTokens(email: string) {
  const all = pruneTokens(readTokens())
  if (!all[email]) return
  delete all[email]
  writeTokens(all)
}

/* ====================== helpers ====================== */
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || process.env.FRONT_ORIGIN || 'https://sign.acadenice.com' // fallback for prod

function absolutifySignatureHtml(html: string): string {
  if (!PUBLIC_ORIGIN) return html

  return html.replace(/(src|href)=["']([^"']+)["']/gi, (full, attr, url) => {
    // уже абсолютный URL или data/cid — не трогаем
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('cid:')) {
      return full
    }

    // protocol-relative //example.com/... →  https://example.com
    if (url.startsWith('//')) {
      return `${attr}="https:${url}"`
    }

    // absolute path /assets/... → our domain
    if (url.startsWith('/')) {
      return `${attr}="${PUBLIC_ORIGIN}${url}"`
    }

    // relative path assets/icons/.. → our domain
    return `${attr}="${PUBLIC_ORIGIN}/${url.replace(/^\.?\//, '')}"`
  })
}
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      // change signature
      'https://www.googleapis.com/auth/gmail.settings.basic',
      // read profile (for users.getProfile)
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  })
}

/* ====================== OAuth start ====================== */

// OAuth start: Google access agreement
gmailRouter.get('/api/gmail/auth', (_req, res) => {
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Gmail integration not configured' })
  }
  const url = getAuthUrl()
  return res.redirect(url)
})

/* ====================== OAuth callback ====================== */

// Callback after Google login: getting tokens + linking
gmailRouter.get('/api/gmail/callback', async (req: any, res) => {
  const code = req.query.code
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code')
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)

    // storing client side (email)
    oauth2Client.setCredentials(tokens)

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const emailAddress = profile.data.emailAddress

    if (!emailAddress) {
      console.error('[gmail] Cannot determine Gmail emailAddress')
      return res.status(500).send('Cannot determine Gmail address')
    }

    // saving tokens on back email
    saveGmailTokens(emailAddress, tokens)

    // saving in cookies
    res.cookie('gmail_email', emailAddress, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600 * 1000,
    })

    return res.redirect('/basic')
  } catch (e: any) {
    console.error('OAuth error:', e)
    return res.status(500).json({ error: e?.message || 'OAuth error' })
  }
})

/* ====================== Signature update ====================== */

gmailRouter.post('/api/gmail/signature', async (req: any, res) => {
  let html: string | undefined = req.body?.html
  if (!html) return res.status(400).json({ error: 'Missing signature HTML' })

  // 🔴 IMPORTANT: before sending rewrite the url to absolute
  html = absolutifySignatureHtml(html)

  try {
    const gmailEmail = req.cookies?.gmail_email
    if (!gmailEmail) {
      return res.status(401).json({ error: 'google_auth_required' })
    }

    const storedTokens = getGmailTokens(gmailEmail)
    if (!storedTokens) {
      return res.status(401).json({ error: 'google_auth_required' })
    }

    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    client.setCredentials(storedTokens)

    const gmail = google.gmail({ version: 'v1', auth: client })

    await gmail.users.settings.sendAs.patch({
      userId: 'me',
      sendAsEmail: gmailEmail,
      requestBody: {
        signature: html, // absolute src/href
      },
    })

    return res.json({ ok: true })
  } catch {
    // ignore
  }
})

/* ====================== Disconnect ====================== */

// Google disconnect logic
gmailRouter.post('/api/gmail/disconnect', async (req: any, res) => {
  try {
    const gmailEmail = req.cookies?.gmail_email

    if (gmailEmail) {
      const storedTokens = getGmailTokens(gmailEmail)
      if (storedTokens?.access_token || storedTokens?.refresh_token) {
        try {
          const tmpClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
          tmpClient.setCredentials(storedTokens)
          await tmpClient.revokeCredentials()
        } catch {
          // revoke
        }
      }

      // cleaning tokens
      deleteGmailTokens(gmailEmail)
    }

    // cleaning cookies
    res.clearCookie('gmail_email')

    return res.json({ ok: true })
  } catch (e: any) {
    console.error('Gmail disconnect error:', e)
    return res.status(500).json({ error: e?.message || 'Gmail disconnect error' })
  }
})

/* ====================== Status ====================== */

gmailRouter.get('/api/gmail/status', (req: any, res) => {
  const gmailEmail = req.cookies?.gmail_email
  if (!gmailEmail) {
    return res.json({ connected: false })
  }

  const tokens = getGmailTokens(gmailEmail)
  const connected = !!tokens

  return res.json({ connected, email: connected ? gmailEmail : undefined })
})

export default gmailRouter
