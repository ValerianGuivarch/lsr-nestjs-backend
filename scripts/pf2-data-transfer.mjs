#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const [action, domain, fileArg, idArg, ...rest] = process.argv.slice(2)
const base = (process.env.PF2_API_URL ?? 'http://localhost:3333/api/pf2-mj').replace(/\/$/, '')
const dryRun = rest.includes('--dry-run') || idArg === '--dry-run'

function usage() {
  console.error(`Usage:\n  node scripts/pf2-data-transfer.mjs export <domain> <fichier.json> [id]\n  node scripts/pf2-data-transfer.mjs import <domain> <fichier.json> [--dry-run]\n\nDomaines: catalogue, geography, pnj, factions, lieux, regions, evenements, curation\nExemples:\n  node scripts/pf2-data-transfer.mjs export geography exports/pf2/geography.json\n  node scripts/pf2-data-transfer.mjs export catalogue exports/pf2/pfs-saison-1.json pfs-season-1\n  node scripts/pf2-data-transfer.mjs import geography exports/pf2/geography.json --dry-run`)
  process.exit(2)
}

if (!['export', 'import'].includes(action) || !domain || !fileArg) usage()

if (action === 'export') {
  const id = idArg && idArg !== '--dry-run' ? idArg : null
  const url = `${base}/data-export/${encodeURIComponent(domain)}${id ? `?id=${encodeURIComponent(id)}` : ''}`
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Export impossible: HTTP ${response.status} ${await response.text()}`)
  const payload = await response.json()
  const target = resolve(fileArg)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`Export ${domain}${id ? ` (${id})` : ''} -> ${target}`)
} else {
  const source = resolve(fileArg)
  const payload = JSON.parse(await readFile(source, 'utf8'))
  const response = await fetch(`${base}/data-import/${encodeURIComponent(domain)}${dryRun ? '?dryRun=true' : ''}`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(payload)
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Import impossible: HTTP ${response.status} ${text}`)
  console.log(JSON.stringify(JSON.parse(text), null, 2))
}
