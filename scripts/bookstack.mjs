import { spawnSync } from 'node:child_process'
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
