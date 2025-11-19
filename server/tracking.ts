// server/tracking.ts
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const router = Router()

// ---- auth helper ----
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable for tracking router')
}

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

// Folder and file for pixel logs
const privateDir = path.join(process.cwd(), '.private')
fs.mkdirSync(privateDir, { recursive: true })
const logFile = path.join(privateDir, 'opens.log')

// Precomputed 1×1 GIF (base64)
const GIF_1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

// ---------------- PUBLIC ENDPOINT: PIXEL ----------------
router.get('/pixel.gif', (req, res) => {
  const entry = {
    ts: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.get('user-agent') || '',
    // All tags passed in query: sender, sig, t, rcpt, etc.
    q: req.query,
  }

  try {
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`)
  } catch {
    // ignore errors
  }

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': String(GIF_1x1.length),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  })

  res.status(200).end(GIF_1x1)
})

// ---------------- PROTECTED ENDPOINTS: LOG + STATS ----------------

// Simple log viewer via API (last N lines)
router.get('/api/pixel-log', requireUser, (req, res) => {
  const limitRaw = Number(req.query.limit ?? 200)
  const limit = Math.min(limitRaw || 200, 2000)

  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ items: [] })
    }

    const raw = fs.readFileSync(logFile, 'utf8').trim().split('\n')

    const tail = raw
      .slice(-limit)
      .map((l) => {
        try {
          return JSON.parse(l)
        } catch {
          return null
        }
      })
      .filter(Boolean)

    return res.json({ items: tail })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'read error' })
  }
})

/**
 * Aggregated statistics endpoint.  Returns total number of pixel hits and
 * aggregated counts by date (YYYY-MM-DD), by signature ID (`sig`) and by
 * recipient (`rcpt`).  Access is restricted to authenticated staff.
 */
router.get('/api/pixel-stats', requireUser, (req, res) => {
  const limitRaw = Number(req.query.limit ?? 20000)
  const limit = Math.min(limitRaw || 20000, 20000)
  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ total: 0, byDate: {}, bySignature: {}, byRecipient: {} })
    }
    const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n')
    const slice = lines.slice(-limit)
    const logs: any[] = []
    for (const l of slice) {
      try {
        logs.push(JSON.parse(l))
      } catch {
        /* ignore malformed */
      }
    }

    const byDate: Record<string, number> = {}
    const bySig: Record<string, number> = {}
    const byRecipient: Record<string, number> = {}

    for (const entry of logs) {
      const ts = entry.ts
      const date = new Date(ts).toISOString().slice(0, 10) // e.g. 2025-11-17
      byDate[date] = (byDate[date] || 0) + 1

      // sig
      const sig = (entry.q?.sig as any) || 'unknown'
      const sigKey = typeof sig === 'string' ? sig : String(sig)
      bySig[sigKey] = (bySig[sigKey] || 0) + 1

      // rcpt
      const rcpt = (entry.q?.rcpt as any) || 'unknown'
      const rcptKey = typeof rcpt === 'string' ? rcpt : String(rcpt)
      byRecipient[rcptKey] = (byRecipient[rcptKey] || 0) + 1
    }

    return res.json({
      total: logs.length,
      byDate,
      bySignature: bySig,
      byRecipient,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'stats error' })
  }
})

export default router
