import { spawnSync } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const action = process.argv[2] ?? 'up'
const actionArgs = {
  up: ['up', '-d'],
  down: ['down'],
  logs: ['logs', '-f']
}[action]

if (!actionArgs) {
  console.error(`Action BookStack inconnue : ${action}`)
  process.exit(2)
}

async function readDotEnv() {
  try {
    const source = await readFile('.env', 'utf8')
    return Object.fromEntries(source.split(/\r?\n/).flatMap(line => {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
      if (!match || line.trimStart().startsWith('#')) return []
      return [[match[1], match[2].replace(/^(?:"|')|(?:"|')$/g, '')]]
    }))
  } catch {
    return {}
  }
}

const dotEnv = await readDotEnv()
const setting = name => process.env[name] || dotEnv[name] || ''

if (action === 'up') {
  const missing = ['BOOKSTACK_APP_KEY', 'BOOKSTACK_DB_PASSWORD', 'BOOKSTACK_DB_ROOT_PASSWORD']
    .filter(name => !setting(name))
  if (missing.length) {
    console.error(`BookStack requiert ces variables dans .env : ${missing.join(', ')}`)
    console.error('Générez la clé avec : openssl rand -base64 32')
    process.exit(1)
  }

  const configuredRoot = setting('BOOKSTACK_DATA_ROOT') || './data/bookstack'
  const dataRoot = resolve('support/bookstack', configuredRoot)
  await Promise.all([mkdir(resolve(dataRoot, 'database'), { recursive: true }), mkdir(resolve(dataRoot, 'config'), { recursive: true })])
}

const candidates = [
  { command: 'docker', prefix: ['compose'], version: ['compose', 'version'] },
  { command: 'docker-compose', prefix: [], version: ['version'] },
  { command: '/var/packages/ContainerManager/target/usr/bin/docker-compose', prefix: [], version: ['version'] }
]

const compose = candidates.find(candidate => {
  const result = spawnSync(candidate.command, candidate.version, { stdio: 'ignore' })
  return result.status === 0
})

if (!compose) {
  console.error([
    'Docker Compose est introuvable.',
    'Vérifiez son emplacement avec :',
    '  command -v docker-compose',
    '  find /var/packages -type f -name docker-compose 2>/dev/null'
  ].join('\n'))
  process.exit(1)
}

const args = [
  ...compose.prefix,
  '--env-file', '.env',
  '-f', 'support/bookstack/docker-compose.yml',
  ...actionArgs
]
const result = spawnSync(compose.command, args, { stdio: 'inherit' })

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
