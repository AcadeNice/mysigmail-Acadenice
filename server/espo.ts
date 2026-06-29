// server/espo.ts
import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { absolutifySignatureHtml } from './gmail'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const privateConfigFile = path.join(__dirname, '.private', 'espo-config.json')

function readPrivateConfig() {
  try {
    if (!fs.existsSync(privateConfigFile)) return {}
    const data = JSON.parse(fs.readFileSync(privateConfigFile, 'utf8'))
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

export function makeEspoRouter(requireUser: any) {
  const router = Router()
  const privateConfig = readPrivateConfig() as { baseUrl?: string, apiKey?: string }

  const baseUrl = (process.env.ESPO_BASE_URL || privateConfig.baseUrl || 'https://crm.acadenice.com/api/v1').replace(/\/$/, '')
  const apiKey = process.env.ESPO_API_KEY || privateConfig.apiKey

  function assertConfigured() {
    if (!apiKey) {
      const error = new Error('espo_not_configured')
      ;(error as any).status = 500
      throw error
    }
  }

  async function espoRequest(path: string, init: RequestInit = {}) {
    assertConfigured()

    const res = await fetch(`${baseUrl}/${path.replace(/^\//, '')}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey!,
        ...(init.headers || {}),
      },
    })

    const text = await res.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text.slice(0, 500) }
    }

    if (!res.ok) {
      const error = new Error(data?.message || `espo_${res.status}`)
      ;(error as any).status = res.status
      ;(error as any).data = data
      throw error
    }

    return data
  }

  async function findEspoUserByEmail(email: string) {
    const params = new URLSearchParams({
      maxSize: '5',
      select: 'id,name,userName,emailAddress,isActive,type',
      'where[0][type]': 'equals',
      'where[0][attribute]': 'emailAddress',
      'where[0][value]': email,
    })

    const data = await espoRequest(`User?${params.toString()}`)
    const users = Array.isArray(data?.list)
      ? data.list.filter((user: any) => user?.isActive !== false)
      : []

    if (!users.length) {
      const error = new Error('espo_user_not_found')
      ;(error as any).status = 404
      throw error
    }

    if (users.length > 1) {
      const error = new Error('espo_multiple_users_found')
      ;(error as any).status = 409
      throw error
    }

    return users[0]
  }

  router.get('/api/espo/status', requireUser, async (req: any, res) => {
    try {
      if (!apiKey) return res.json({ configured: false, connected: false })

      const gmailEmail = req.cookies?.gmail_email
      if (!gmailEmail) {
        return res.json({ configured: true, connected: false, googleAuthRequired: true })
      }

      const user = await findEspoUserByEmail(gmailEmail)
      return res.json({
        configured: true,
        connected: true,
        email: gmailEmail,
        user: {
          id: user.id,
          name: user.name,
          userName: user.userName,
        },
      })
    } catch (e: any) {
      if (e?.message === 'espo_user_not_found') {
        return res.json({ configured: true, connected: false, email: req.cookies?.gmail_email, error: e.message })
      }

      console.error('[espo] status error:', e)
      return res.status(e?.status || 500).json({ error: e?.message || 'espo_status_error' })
    }
  })

  router.post('/api/espo/signature', requireUser, async (req: any, res) => {
    try {
      let html: string | undefined = req.body?.html
      if (!html) return res.status(400).json({ error: 'Missing signature HTML' })

      const gmailEmail = req.cookies?.gmail_email
      if (!gmailEmail) return res.status(401).json({ error: 'google_auth_required' })

      html = absolutifySignatureHtml(html)

      const user = await findEspoUserByEmail(gmailEmail)
      await espoRequest(`Preferences/${encodeURIComponent(user.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ signature: html }),
      })

      return res.json({
        ok: true,
        email: gmailEmail,
        user: {
          id: user.id,
          name: user.name,
          userName: user.userName,
        },
      })
    } catch (e: any) {
      if (e?.message === 'espo_not_configured') {
        return res.status(500).json({ error: 'espo_not_configured' })
      }

      if (e?.message === 'espo_user_not_found') {
        return res.status(404).json({ error: 'espo_user_not_found' })
      }

      if (e?.message === 'espo_multiple_users_found') {
        return res.status(409).json({ error: 'espo_multiple_users_found' })
      }

      if (e?.status === 403) {
        return res.status(403).json({
          error: 'espo_preferences_forbidden',
          message: 'L’utilisateur API EspoCRM doit pouvoir modifier Preferences pour l’utilisateur cible.',
        })
      }

      console.error('[espo] signature sync error:', e)
      return res.status(e?.status || 500).json({ error: e?.message || 'espo_signature_error' })
    }
  })

  return router
}

export default makeEspoRouter
