import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import * as fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { EMAIL_REGEX, FR_PHONE_REGEX } from '../src/utils/validators'
import gmailRouter from './gmail'
import trackingRouter from './tracking'
// Gmail integration router handles OAuth and signature updates
import { makeProtectedUploadRoutes } from './upload'

// Import shared validation patterns.  Using a shared module ensures the client
// and server perform identical checks for email and French phone numbers.
// The path is relative to the project root; adjust if your build config differs.

const app = express()

// configure CORS for development; the second CORS configuration later
// overrides this one with FRONT_ORIGIN in production
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Require secrets to be provided via environment variables.  Do not fall back
// to insecure defaults.  If these are missing the server will crash at
// startup rather than silently using weak secrets.
const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable')
if (!ADMIN_PASSWORD) throw new Error('Missing ADMIN_PASSWORD environment variable')

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:5173'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Limit login attempts to prevent brute forcing the admin password
const loginLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20 })

// Limit guest registrations to avoid spam or DoS attacks.  A generous
// window is used since this endpoint may be hit by multiple guests but
// prevents unbounded growth of the guest list file.
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 })

app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const raw = req.body?.password ?? ''
    const password = typeof raw === 'string' ? raw.trim() : ''
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' })

    const token = jwt.sign({ role: 'user' }, JWT_SECRET!, { expiresIn: '7d' })
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      // Secure cookies are required in production.  When developing over HTTP
      // you may set NODE_ENV=development to allow insecure cookies.
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600 * 1000,
    })
    return res.json({ role: 'user' })
  } catch (e: any) {
    console.error('Login error:', e)
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('access_token')
  res.json({ ok: true })
})

app.get('/api/auth/status', (req, res) => {
  try {
    const token = req.cookies?.access_token
    if (!token) return res.json({ role: 'guest' })
    const payload = jwt.verify(token, JWT_SECRET!) as any
    return res.json({ role: payload.role === 'user' ? 'user' : 'guest' })
  } catch {
    return res.json({ role: 'guest' })
  }
})

function requireUser(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.access_token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = jwt.verify(token, JWT_SECRET!) as any
    if (payload.role !== 'user') return res.status(403).json({ error: 'Forbidden' })
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// Register protected routes and static file serving
app.use(makeProtectedUploadRoutes(requireUser))
app.use((req, res, next) => {
  if (req.path.includes('/.private')) {
    return res.status(404).end()
  }
  next()
})
// Serve uploaded files publicly; disable caching and do not allow path traversal
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    etag: true,
    lastModified: true,
    cacheControl: true,
    maxAge: 0,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-cache')
    },
  }),
)
app.use('/', trackingRouter)
// Mount the Gmail integration router.  This provides /api/gmail/auth,
// /api/gmail/callback and /api/gmail/signature endpoints.
app.use('/', gmailRouter)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('API error:', err)
  res.status(500).json({ error: String(err?.message || err) })
})

/**
 * Sanitize a string for use as a stable identifier.  Converts the input to
 * lowercase, replaces whitespace with underscores, removes accents, drops
 * invalid characters and collapses multiple underscores.  Leading and
 * trailing underscores are also removed.
 */
function sanitizeId(input: string) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const dataDir = path.join(__dirname, '.private')
fs.mkdirSync(dataDir, { recursive: true })
const guestsFile = path.join(dataDir, 'guests.json')

/** load current guest list (safe) */
function readGuests(): any[] {
  try {
    if (!fs.existsSync(guestsFile)) return []
    const raw = fs.readFileSync(guestsFile, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** save guest list (atomic-ish) */
function writeGuests(list: any[]) {
  const tmp = `${guestsFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2))
  fs.renameSync(tmp, guestsFile)
}

/**
 * Public endpoint: store optional guest info.  This endpoint is rate
 * limited and validates inputs against common patterns.  Excessively long
 * names and emails are rejected to avoid flooding the guest registry.
 */
app.post('/api/guest/register', registerLimiter, async (req, res) => {
  try {
    const name = (req.body?.name ?? '').toString().trim()
    const email = (req.body?.email ?? '').toString().trim()
    const phone = (req.body?.phone ?? '').toString().trim()
    const enterprise = (req.body?.enterprise ?? '').toString().trim() || undefined

    // Validate name: required and not too long.  Reject emoji or non latin
    // letters by ensuring the sanitized id is non-empty.  You could relax
    // this condition depending on your target audience.
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    if (name.length > 80) return res.status(400).json({ error: 'Nom trop long' })
    // Validate email and phone using shared regexes.
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'E‑mail invalide' })
    if (!FR_PHONE_REGEX.test(phone)) return res.status(400).json({ error: 'Téléphone invalide' })

    const list = readGuests()

    // Derive a unique id from the sanitized name or fallback to userN
    let base = name ? sanitizeId(name) : ''
    if (!base) base = `user${list.length + 1}`
    let id = base
    let suffix = 2
    while (list.some((g) => g.id === id)) {
      id = `${base}${suffix++}`
    }

    const entry = {
      id,
      name,
      email,
      phone,
      enterprise,
      ts: Date.now(),
    }
    list.push(entry)
    writeGuests(list)

    res.json({ ok: true, id })
  } catch (e: any) {
    console.error('guest/register error:', e)
    res.status(500).json({ error: e?.message || 'Internal error' })
  }
})

app.get('/api/admin/guests', requireUser, (_req, res) => {
  try {
    const list = readGuests()
    return res.json({ ok: true, list })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
})

// Configure CORS using FRONT_ORIGIN.  This overrides the earlier CORS
// middleware and should be the last CORS configuration before starting the
// server.
app.use(cors({ origin: FRONT_ORIGIN, credentials: true }))
const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => console.warn(`API listening on http://localhost:${PORT}`))
