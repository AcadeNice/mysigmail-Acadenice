import { Router } from 'express'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const router = Router()

// Folder and file for pixel logs
const privateDir = path.join(process.cwd(), '.private')
fs.mkdirSync(privateDir, { recursive: true })
const logFile = path.join(privateDir, 'opens.log')

// Precomputed 1×1 GIF (base64)
const GIF_1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

// Pixel endpoint — send a 1×1 GIF and append an event to the log
router.get('/pixel.gif', (req, res) => {
  const entry = {
    ts: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.get('user-agent') || '',
    // All tags passed in query: sender, sig, t, etc.
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

// Simple log viewer via API (last N lines)
router.get('/api/pixel-log', (req, res) => {
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
 * aggregated counts by date (YYYY-MM-DD) and by signature ID (query
 * parameter `sig`).  An optional `limit` query parameter controls how many
 * lines of the log are considered, with a maximum of 20000.  Unknown
 * signatures (missing `sig` parameter) are grouped under the `unknown`
 * key.
 */
router.get('/api/pixel-stats', (req, res) => {
  const limitRaw = Number(req.query.limit ?? 20000)
  const limit = Math.min(limitRaw || 20000, 20000)
  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ total: 0, byDate: {}, bySignature: {} })
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
    for (const entry of logs) {
      const ts = entry.ts
      const date = new Date(ts).toISOString().slice(0, 10) // e.g. 2025-11-17
      byDate[date] = (byDate[date] || 0) + 1
      const sig = (entry.q?.sig as any) || 'unknown'
      const key = typeof sig === 'string' ? sig : String(sig)
      bySig[key] = (bySig[key] || 0) + 1
    }
    return res.json({ total: logs.length, byDate, bySignature: bySig })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'stats error' })
  }
})

export default router
