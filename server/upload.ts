import type { Request, Response } from 'express'

import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const uploadDir = path.join(process.cwd(), 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const BANNER_FILENAME = 'acadenice-banniere.png'
const HIDDEN_BANNER_FILENAME = 'acadenice-banniere-hide.png'
const TRANSPARENT_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64',
)

// public/assets for banner. In Docker, Apache serves /assets from /var/www/html/assets.
const publicAssetsDir = process.env.PUBLIC_ASSETS_DIR
  || (fs.existsSync('/var/www/html/assets')
    ? '/var/www/html/assets'
    : path.join(process.cwd(), 'public', 'assets'))
fs.mkdirSync(publicAssetsDir, { recursive: true })

function bannerPath() {
  return path.join(publicAssetsDir, BANNER_FILENAME)
}

function hiddenBannerPath() {
  return path.join(publicAssetsDir, HIDDEN_BANNER_FILENAME)
}

function isTransparentPixelFile(filePath: string) {
  try {
    return fs.existsSync(filePath) && fs.readFileSync(filePath).equals(TRANSPARENT_PIXEL_PNG)
  } catch {
    return false
  }
}

function readBannerInfo() {
  const p = bannerPath()
  const backup = hiddenBannerPath()
  const exists = fs.existsSync(p)
  const stat = exists ? fs.statSync(p) : null

  return {
    exists,
    hidden: fs.existsSync(backup) || isTransparentPixelFile(p),
    mtime: stat?.mtimeMs ?? 0,
    path: `/assets/${BANNER_FILENAME}`,
  }
}

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

/* ---------- Avatars ---------- */
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
    try {
      return res.json(readBannerInfo())
    } catch {
      return res.json({ exists: false, hidden: false, mtime: 0, path: `/assets/${BANNER_FILENAME}` })
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

        const target = bannerPath()
        const hidden = hiddenBannerPath()
        if (fs.existsSync(hidden)) {
          fs.rmSync(hidden)
        }

        fs.writeFileSync(target, req.file.buffer)

        return res.json({
          ok: true,
          ...readBannerInfo(),
        })
      } catch (e: any) {
        console.error('banner-upload error:', e)
        return res.status(500).json({ error: e?.message || 'Internal error' })
      }
    },
  )

  router.post('/api/banner-visibility', requireUser, (req: Request, res: Response) => {
    try {
      const hidden = Boolean(req.body?.hidden)
      const target = bannerPath()
      const backup = hiddenBannerPath()

      if (hidden) {
        if (!fs.existsSync(backup) && fs.existsSync(target)) {
          fs.renameSync(target, backup)
        }

        fs.writeFileSync(target, TRANSPARENT_PIXEL_PNG)
      } else if (fs.existsSync(backup)) {
        if (fs.existsSync(target)) {
          fs.rmSync(target)
        }
        fs.renameSync(backup, target)
      }

      return res.json({
        ok: true,
        ...readBannerInfo(),
      })
    } catch (e: any) {
      console.error('banner-visibility error:', e)
      return res.status(500).json({ error: e?.message || 'Internal error' })
    }
  })

  return router
}
