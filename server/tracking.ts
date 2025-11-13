import { Router } from 'express'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const router = Router()

// Папка и файл логов
const privateDir = path.join(process.cwd(), '.private')
fs.mkdirSync(privateDir, { recursive: true })
const logFile = path.join(privateDir, 'opens.log')

// Готовый 1×1 GIF (base64)
const GIF_1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

// Эндпоинт пикселя — отдаём 1×1 GIF и пишем событие в лог
router.get('/pixel.gif', (req, res) => {
  const entry = {
    ts: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    ua: req.get('user-agent') || '',
    // Все метки, которые вы передали в query: sender, sig, t и т.п.
    q: req.query,
  }

  try {
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`)
  } catch {
    // ignore
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

// Простой просмотр логов через API (последние N строк)
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

export default router
