// server/gmailStore.ts

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '.private')
fs.mkdirSync(dataDir, { recursive: true })
const tokensFile = path.join(dataDir, 'gmail-tokens.json')

interface GmailTokenEntry {
  email: string
  tokens: any
}

function readTokens(): Record<string, GmailTokenEntry> {
  try {
    if (!fs.existsSync(tokensFile)) return {}
    const raw = fs.readFileSync(tokensFile, 'utf8')
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? (obj as Record<string, GmailTokenEntry>) : {}
  } catch {
    return {}
  }
}

function writeTokens(map: Record<string, GmailTokenEntry>) {
  const tmp = `${tokensFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(map, null, 2))
  fs.renameSync(tmp, tokensFile)
}

export function saveGmailTokens(email: string, tokens: any) {
  const all = readTokens()
  all[email] = { email, tokens }
  writeTokens(all)
}

export function getGmailTokens(email: string): any | null {
  const all = readTokens()
  return all[email]?.tokens ?? null
}

export function deleteGmailTokens(email: string) {
  const all = readTokens()
  if (!all[email]) return
  delete all[email]
  writeTokens(all)
}
