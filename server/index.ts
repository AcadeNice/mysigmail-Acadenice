// server/index.ts
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
import { makeEspoRouter } from './espo'
import gmailRouter from './gmail'
import trackingRouter from './tracking'
import { makeProtectedUploadRoutes } from './upload'

const app = express()

// Trust proxy (Traefik, Apache) - configure with specific number of hops
// 1 = trust first proxy (Apache), 2 = trust Apache + Traefik
app.set('trust proxy', 2)

// Single CORS configuration for both dev and prod.
// FRONT_ORIGIN should be set in the environment in production
// (e.g. https://sign.acadenice.com). In dev we fall back to Vite default.
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'https://sign.acadenice.com'
app.use(cors({ origin: FRONT_ORIGIN, credentials: true }))

app.use(express.json())
app.use(cookieParser())

// Require secrets via environment variables. If they are missing, crash early
// instead of silently using weak defaults.
const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim() // Trim to remove any whitespace/newlines
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable')
if (!ADMIN_PASSWORD) throw new Error('Missing ADMIN_PASSWORD environment variable')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rate-limit login attempts to reduce brute-force risk.
// Note: express-rate-limit warns about trust proxy, but it's safe here
// since we control the proxy (Apache/Traefik) and it's not exposed to the internet
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate-limit guest registrations to avoid spam/DoS.
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 })

/* ====================== Auth endpoints ====================== */

app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    // Debug: log the raw request body to see what we're receiving
    console.log('Login request body type:', typeof req.body)
    console.log('Login request body keys:', Object.keys(req.body || {}))
    const raw = req.body?.password ?? ''
    const password = typeof raw === 'string' ? raw.trim() : ''
    // Debug: log lengths and compare (without exposing the password)
    const expectedLen = ADMIN_PASSWORD.length
    const receivedLen = password.length
    // Debug: log first and last character codes (for debugging without exposing password)
    const expectedFirst = ADMIN_PASSWORD.charCodeAt(0)
    const expectedLast = ADMIN_PASSWORD.charCodeAt(ADMIN_PASSWORD.length - 1)
    const receivedFirst = password.charCodeAt(0)
    const receivedLast = password.charCodeAt(password.length - 1)
    console.log(
      `Login attempt: received length ${receivedLen}, expected length ${expectedLen}`,
      `received type: ${typeof raw}, after trim: ${password.length}`,
      `first char codes: received=${receivedFirst}, expected=${expectedFirst}`,
      `last char codes: received=${receivedLast}, expected=${expectedLast}`,
    )
    if (password !== ADMIN_PASSWORD) {
      console.warn(
        `Login attempt failed: received length ${receivedLen}, expected length ${expectedLen}`,
        receivedLen !== expectedLen ? '(length mismatch)' : '(content mismatch)',
      )
      return res.status(401).json({ error: 'Invalid password' })
    }

    const token = jwt.sign({ role: 'user' }, JWT_SECRET!, { expiresIn: '7d' })
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
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
app.post('/api/disconnect-all', async (_req, res) => {
  try {
    // 1) logout
    res.clearCookie('access_token')

    // 2) Google disconnect logic
    // using /api/gmail/disconnect

    // 3) just in case:
    return res.json({ ok: true })
  } catch (e: any) {
    console.error('disconnect-all error:', e)
    return res.status(500).json({ error: e?.message || 'Internal error' })
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

/* ====================== Guest registry ====================== */

/**
 * Sanitize a string for use as a stable identifier. Converts the input
 * to lowercase, replaces whitespace with underscores, removes accents,
 * drops invalid characters and collapses multiple underscores. Leading
 * and trailing underscores are also removed.
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

// Retention / size limits for the guest registry.
// These can be overridden via environment variables if needed.
const GUEST_MAX_AGE_DAYS = Number(process.env.GUEST_MAX_AGE_DAYS || 364) // default: 1 year
const GUEST_MAX_ENTRIES = Number(process.env.GUEST_MAX_ENTRIES || 10000) // default: 10k entries

interface GuestEntry {
  id: string
  name: string
  email: string
  phone: string
  enterprise?: string
  ts: number
}

/** Load current guest list from disk. On any error returns an empty array. */
function readGuests(): GuestEntry[] {
  try {
    if (!fs.existsSync(guestsFile)) return []
    const raw = fs.readFileSync(guestsFile, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as GuestEntry[]) : []
  } catch {
    return []
  }
}

/**
 * Save guest list to disk using a simple "write temp + rename" pattern.
 * This is not fully crash-safe (no fsync) but is good enough for this scale.
 */
function writeGuests(list: GuestEntry[]) {
  const tmp = `${guestsFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2))
  fs.renameSync(tmp, guestsFile)
}

/**
 * Prune guest list:
 *  - drop entries older than GUEST_MAX_AGE_DAYS
 *  - enforce maximum count GUEST_MAX_ENTRIES (keep newest by ts)
 */
function pruneGuests(list: GuestEntry[]): GuestEntry[] {
  const now = Date.now()
  const cutoff = now - GUEST_MAX_AGE_DAYS * 24 * 60 * 60 * 1000

  // Filter by age
  let pruned = list.filter((g) => typeof g.ts === 'number' && g.ts >= cutoff)

  // Enforce max count
  if (pruned.length > GUEST_MAX_ENTRIES) {
    pruned = pruned
      .slice()
      .sort((a, b) => a.ts - b.ts) // oldest first
      .slice(pruned.length - GUEST_MAX_ENTRIES) // keep newest
  }

  return pruned
}

/**
 * Public endpoint: store optional guest info.
 * This endpoint is rate-limited and validates input using shared regexes.
 * Before appending a new guest, we prune old / excess entries.
 */
app.post('/api/guest/register', registerLimiter, async (req, res) => {
  try {
    const name = (req.body?.name ?? '').toString().trim()
    const email = (req.body?.email ?? '').toString().trim()
    const phone = (req.body?.phone ?? '').toString().trim()
    const enterprise = (req.body?.enterprise ?? '').toString().trim() || undefined

    // Basic validation
    if (!name) return res.status(400).json({ error: 'Nom requis' })
    if (name.length > 80) return res.status(400).json({ error: 'Nom trop long' })
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'E-mail invalide' })
    if (!FR_PHONE_REGEX.test(phone)) return res.status(400).json({ error: 'Téléphone invalide' })

    // Load, prune and then append.
    let list = readGuests()
    list = pruneGuests(list)

    // Derive a unique id from the sanitized name or fall back to userN.
    let base = name ? sanitizeId(name) : ''
    if (!base) base = `user${list.length + 1}`
    let id = base
    let suffix = 2
    while (list.some((g) => g.id === id)) {
      id = `${base}${suffix++}`
    }

    const entry: GuestEntry = {
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

/**
 * Admin endpoint: fetch current (already pruned) guest list.
 * If pruning removes entries, the file is rewritten in the pruned form.
 */
app.get('/api/admin/guests', requireUser, (_req, res) => {
  try {
    let list = readGuests()
    const pruned = pruneGuests(list)

    if (pruned.length !== list.length) {
      writeGuests(pruned)
      list = pruned
    }

    return res.json({ ok: true, list })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
})

/**
 * Admin endpoint: manual cleanup of guest registry.
 *  - POST /api/admin/guests/cleanup { "mode": "all" }
 *  - POST /api/admin/guests/cleanup { "mode": "olderThanDays", "days": 90 }
 */
app.post('/api/admin/guests/cleanup', requireUser, (req, res) => {
  try {
    const mode = req.body?.mode || 'all'
    let list = readGuests()

    if (mode === 'all') {
      list = []
    } else if (mode === 'olderThanDays') {
      const days = Number(req.body?.days || GUEST_MAX_AGE_DAYS)
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
      list = list.filter((g) => typeof g.ts === 'number' && g.ts >= cutoff)
    } else {
      return res.status(400).json({ error: 'Unknown cleanup mode' })
    }

    writeGuests(list)
    return res.json({ ok: true, remaining: list.length })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
})

/* ====================== Uploads / tracking / Gmail ====================== */

// Register protected upload routes (require admin)
app.use(makeProtectedUploadRoutes(requireUser))

// Block direct access to ".private" directory via HTTP.
app.use((req, res, next) => {
  if (req.path.includes('/.private')) {
    return res.status(404).end()
  }
  next()
})

// Serve uploaded files publicly; disable caching and prevent path traversal.
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

// Tracking router (pixel, stats, etc.)
app.use('/', trackingRouter)

// Gmail integration router (OAuth + signature updates)
app.use('/', gmailRouter)

// EspoCRM integration router (signature update)
app.use('/', makeEspoRouter(requireUser))

/* ====================== Error handler & server start ====================== */

// Final error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('API error:', err)
  res.status(500).json({ error: String(err?.message || err) })
})

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.warn(`API listening on http://0.0.0.0:${PORT}`)
})
