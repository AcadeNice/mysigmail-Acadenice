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

import trackingRouter from './tracking'
import { makeProtectedUploadRoutes } from './upload'

const app = express()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:5173'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// чтобы увидеть, подхватился ли .env
console.warn('[auth] ADMIN_PASSWORD present?', Boolean(process.env.ADMIN_PASSWORD))

const loginLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20 })

app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const raw = req.body?.password ?? ''
    const password = typeof raw === 'string' ? raw.trim() : ''
    if (!ADMIN_PASSWORD) return res.status(500).json({ error: 'Server password not configured' })
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' })

    const token = jwt.sign({ role: 'user' }, JWT_SECRET, { expiresIn: '7d' })
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // в проде true (HTTPS)
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
    const payload = jwt.verify(token, JWT_SECRET) as any
    return res.json({ role: payload.role === 'user' ? 'user' : 'guest' })
  } catch {
    return res.json({ role: 'guest' })
  }
})

function requireUser(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.access_token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.role !== 'user') return res.status(403).json({ error: 'Forbidden' })
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

// защищённые API (загрузка/поиск картинок)
app.use(makeProtectedUploadRoutes(requireUser))
app.use((req, res, next) => {
  if (req.path.includes('/.private')) {
    return res.status(404).end()
  }
  next()
})
// ПУБЛИЧНАЯ раздача картинок для форумов — без авторизации
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
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('API error:', err)
  res.status(500).json({ error: String(err?.message || err) })
})
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

/** load current list (safe) */
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

/** save list (atomic-ish) */
function writeGuests(list: any[]) {
  const tmp = `${guestsFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2))
  fs.renameSync(tmp, guestsFile)
}

/** public endpoint: store optional guest info */
app.post('/api/guest/register', async (req, res) => {
  try {
    const name = (req.body?.name ?? '').toString().trim()
    const email = (req.body?.email ?? '').toString().trim()
    const phone = (req.body?.phone ?? '').toString().trim()
    const enterprise = (req.body?.enterprise ?? '').toString().trim() || undefined

    // same regexes as on client
    const emailRx = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    const frPhoneRx = /^(?:\+33\s?[1-9](?:[\s.-]?\d{2}){4}|0[1-9](?:[\s.-]?\d{2}){4})$/

    if (!name) return res.status(400).json({ error: 'Nom requis' })
    if (!emailRx.test(email)) return res.status(400).json({ error: 'E-mail invalide' })
    if (!frPhoneRx.test(phone)) return res.status(400).json({ error: 'Téléphone invalide' })

    const list = readGuests()

    // id = от имени, иначе userN
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

app.use(cors({ origin: FRONT_ORIGIN, credentials: true }))
const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => console.warn(`API listening on http://localhost:${PORT}`))
