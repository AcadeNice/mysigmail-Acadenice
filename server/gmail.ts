import { Router } from 'express'
import { google } from 'googleapis'
import process from 'node:process'

/**
 * Gmail integration router. Implements:
 *   GET  /api/gmail/auth        — старт OAuth
 *   GET  /api/gmail/callback    — приём кода от Google
 *   POST /api/gmail/signature   — обновление подписи
 *   POST /api/gmail/disconnect  — сброс токенов
 *
 * Требуются переменные окружения:
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
      // менять подпись
      'https://www.googleapis.com/auth/gmail.settings.basic',
      // читать профиль (для users.getProfile)
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  })
}

// Начало OAuth: редирект на страницу согласия Google
gmailRouter.get('/api/gmail/auth', (_req, res) => {
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: 'Gmail integration not configured' })
  }
  const url = getAuthUrl()
  return res.redirect(url)
})

// Callback после логина Google: обмен кода на токены
gmailRouter.get('/api/gmail/callback', async (req: any, res) => {
  const code = req.query.code
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing code')
  }
  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    // Возврат в основное приложение (можно на /basic или /)
    return res.redirect('/')
  } catch (e: any) {
    console.error('OAuth error:', e)
    return res.status(500).json({ error: e?.message || 'OAuth error' })
  }
})

// Обновление подписи Gmail
gmailRouter.post('/api/gmail/signature', async (req: any, res) => {
  const html: string | undefined = req.body?.html
  if (!html) return res.status(400).json({ error: 'Missing signature HTML' })

  try {
    // если ещё не логинились / токен очищен
    if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
      return res.status(401).json({ error: 'google_auth_required' })
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // основной e-mail пользователя
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
      // токен протух / был отозван → заставляем пользователя перелогиниться
      oauth2Client.setCredentials({})
      return res.status(401).json({ error: 'google_auth_required' })
    }

    return res.status(500).json({ error: e?.message || 'Gmail update error' })
  }
})

// Явная деавторизация Google из приложения
gmailRouter.post('/api/gmail/disconnect', async (_req, res) => {
  try {
    if (oauth2Client.credentials?.access_token || oauth2Client.credentials?.refresh_token) {
      try {
        await oauth2Client.revokeCredentials()
      } catch {
        // игнорируем ошибку revoke
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
