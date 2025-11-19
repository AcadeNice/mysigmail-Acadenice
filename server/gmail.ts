import { Router } from 'express'
import { google } from 'googleapis'
import process from 'node:process'

/**
 * Gmail integration router. Implements:
 *   GET  /api/gmail/auth        — start OAuth
 *   GET  /api/gmail/callback    — getting Google code
 *   POST /api/gmail/signature   — signature updates
 *   POST /api/gmail/disconnect  — token deattachment
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

// OAuth start: Google access agreement
gmailRouter.get('/api/gmail/auth', (_req, res) => {
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Gmail integration not configured' })
  }
  const url = getAuthUrl()
  return res.redirect(url)
})

// Callback after Google login: getting tokens
gmailRouter.get('/api/gmail/callback', async (req: any, res) => {
  const code = req.query.code
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code')
  }
  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    // redirect back to app (/basic or we use /)
    return res.redirect('/')
  } catch (e: any) {
    console.error('OAuth error:', e)
    return res.status(500).json({ error: e?.message || 'OAuth error' })
  }
})

//  Gmail signature update
gmailRouter.post('/api/gmail/signature', async (req: any, res) => {
  const html: string | undefined = req.body?.html
  if (!html) return res.status(400).json({ error: 'Missing signature HTML' })

  try {
    // in case we dont have a valid token
    if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
      return res.status(401).json({ error: 'google_auth_required' })
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // primary user e-mail
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const emailAddress = profile.data.emailAddress || 'me'

    await gmail.users.settings.sendAs.patch({
      userId: 'me',
      sendAsEmail: emailAddress,
      requestBody: {
        signature: html,
      },
    })

    return res.json({ ok: true })
  } catch (e: any) {
    console.error('Gmail update error:', e)

    const status = e?.code || e?.response?.status
    if (status === 401 || status === 403) {
      // token is expired => force login back
      oauth2Client.setCredentials({})
      return res.status(401).json({ error: 'google_auth_required' })
    }

    return res.status(500).json({ error: e?.message || 'Gmail update error' })
  }
})

// Google disconnect logic
gmailRouter.post('/api/gmail/disconnect', async (_req, res) => {
  try {
    if (oauth2Client.credentials?.access_token || oauth2Client.credentials?.refresh_token) {
      try {
        await oauth2Client.revokeCredentials()
      } catch {
        // just ignoring revoke
      }
    }
    oauth2Client.setCredentials({})
    return res.json({ ok: true })
  } catch (e: any) {
    console.error('Gmail disconnect error:', e)
    return res.status(500).json({ error: e?.message || 'Gmail disconnect error' })
  }
})

gmailRouter.get('/api/gmail/status', (_req, res) => {
  const connected = Boolean(
    oauth2Client.credentials?.access_token || oauth2Client.credentials?.refresh_token,
  )

  return res.json({ connected })
})

export default gmailRouter
