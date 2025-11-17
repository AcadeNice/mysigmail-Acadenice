import type { Request, Response } from 'express'

import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

// public/assets для баннера
const publicAssetsDir = path.join(process.cwd(), 'public', 'assets')
fs.mkdirSync(publicAssetsDir, { recursive: true })

function sanitizeBase(input: string) {
  if (!input) return ''
  let s = input.toLowerCase().trim()
  s = s
    .replace(/\s+/g, '_')
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
  s = s
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return s
}

function findExistingByBase(base: string): string | null {
  const files = fs.readdirSync(uploadDir)
  const rx = new RegExp(`^${base}\\.(png|jpe?g|gif)$`, 'i')
  return files.find((f) => rx.test(f)) ?? null
}

function extFromMime(m: string): string {
  if (m === 'image/png') return '.png'
  if (m === 'image/gif') return '.gif'
  return '.jpg'
}

/* ---------- Аватарки (как было) ---------- */
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req: Request, file, cb) => {
    const sentBase = sanitizeBase((req.body as any)?.base || '')
    const orig = (file.originalname || 'image').toLowerCase()
    const extFromOrig = path.extname(orig) || extFromMime(file.mimetype)
    const base = sentBase || 'image'
    const existing = findExistingByBase(base)
    if (existing) {
      return cb(null, existing)
    }
    cb(null, `${base}${extFromOrig}`)
  },
})

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)
    cb(null, ok)
  },
})

/* ---------- banner (fixed name) ---------- */
/* memoryStorage */
const bannerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // only png
    const ok = file.mimetype === 'image/png'
    cb(null, ok)
  },
})

export function makeProtectedUploadRoutes(requireUser: any) {
  const router = Router()

  // avatar info
  router.get('/api/file-info', requireUser, (req: Request, res: Response) => {
    const base = sanitizeBase(String(req.query.base || ''))
    if (!base) {
      return res.json({ exists: false })
    }

    const rx = new RegExp(`^${base}\\.(png|jpe?g|gif)$`, 'i')
    const files = fs.readdirSync(uploadDir)
    const hit = files.find((f) => rx.test(f))
    if (!hit) {
      return res.json({ exists: false })
    }

    const stat = fs.statSync(path.join(uploadDir, hit))
    return res.json({ exists: true, filename: hit, mtime: stat.mtimeMs })
  })

  // avatar upload
  router.post('/api/upload', requireUser, avatarUpload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file or unsupported type' })
    }

    const stat = fs.statSync(req.file.path)
    return res.json({ ok: true, filename: req.file.filename, mtime: stat.mtimeMs })
  })

  router.get('/api/banner-info', (_req, res) => {
    const p = path.join(publicAssetsDir, 'acadenice-banner.png')
    try {
      if (!fs.existsSync(p)) {
        return res.json({ exists: false })
      }

      const stat = fs.statSync(p)
      return res.json({
        exists: true,
        path: '/assets/acadenice-banner.png',
        mtime: stat.mtimeMs,
      })
    } catch {
      return res.json({ exists: false })
    }
  })

  router.post(
    '/api/banner-upload',
    requireUser,
    bannerUpload.single('file'),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file or unsupported type (PNG only)' })
        }

        const target = path.join(publicAssetsDir, 'acadenice-banner.png')
        // rewriting file
        fs.writeFileSync(target, req.file.buffer)
        const stat = fs.statSync(target)

        return res.json({
          ok: true,
          path: '/assets/acadenice-banner.png',
          mtime: stat.mtimeMs,
        })
      } catch (e: any) {
        console.error('banner-upload error:', e)
        return res.status(500).json({ error: e?.message || 'Internal error' })
      }
    },
  )

  return router
}
