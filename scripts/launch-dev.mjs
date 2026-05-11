import { spawn, spawnSync } from 'node:child_process'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const CONFIG_PATH = path.join(process.cwd(), 'config-runner.json')
const LEGACY_CONFIG_PATH = path.join(process.cwd(), '.dev-launcher.config.json')
const argv = process.argv.slice(2)
const args = new Set(argv)
const openConfigMenu = args.has('--config') || args.has('-c') || args.has('--reconfigure') || args.has('-r')
const listProfilesOnly = args.has('--list') || args.has('-l')
const showHelpOnly = args.has('--help') || args.has('-h')

const lotKeys = ['hp', 'l7r', 'jdr', 'ghost', 'yeardiary']
const lotLabels = {
  hp: 'lot HP (backend + frontend shell)',
  l7r: 'lot L7R (backend + frontend shell)',
  jdr: 'lot JDR (backend + frontend shell)',
  ghost: 'lot Ghost (backend + frontend shell)',
  yeardiary: 'lot YearDiary (backend + frontend shell)'
}

const profileDescriptions = {
  full: 'Tous les lots actifs',
  hp: 'Lot HP uniquement',
  l7r: 'Lot L7R uniquement',
  jdr: 'Lot JDR uniquement',
  ghost: 'Lot Ghost uniquement',
  yeardiary: 'Lot YearDiary uniquement',
  legacyGhost: 'Stack Ghost legacy (api + dashboard + player)'
}

const defaultConfig = {
  backendUnified: true,
  frontendShell: true,
  ghostLegacy: false,
  stopPortsBeforeLaunch: false,
  domains: {
    hp: true,
    l7r: true,
    jdr: true,
    ghost: true,
    yeardiary: true
  }
}

function mergeConfig(baseConfig, overrideConfig) {
  return {
    ...baseConfig,
    ...overrideConfig,
    domains: {
      ...baseConfig.domains,
      ...(overrideConfig?.domains ?? {})
    }
  }
}

function createLotProfile(enabledLots) {
  const hasAtLeastOneLot = enabledLots.length > 0
  const domains = {}

  for (const key of lotKeys) {
    domains[key] = enabledLots.includes(key)
  }

  return {
    backendUnified: hasAtLeastOneLot,
    frontendShell: hasAtLeastOneLot,
    ghostLegacy: false,
    stopPortsBeforeLaunch: false,
    domains
  }
}

const builtInProfiles = {
  full: createLotProfile(lotKeys),
  hp: createLotProfile(['hp']),
  l7r: createLotProfile(['l7r']),
  jdr: createLotProfile(['jdr']),
  ghost: createLotProfile(['ghost']),
  yeardiary: createLotProfile(['yeardiary']),
  legacyGhost: {
    backendUnified: false,
    frontendShell: false,
    ghostLegacy: true,
    stopPortsBeforeLaunch: false,
    domains: {
      hp: false,
      l7r: false,
      jdr: false,
      ghost: true,
      yeardiary: false
    }
  }
}

function defaultRunnerConfig() {
  return {
    version: 1,
    lastProfile: 'full',
    configs: {}
  }
}

function getProfileName() {
  const profileArg = argv.find(arg => arg.startsWith('--profile='))

  if (profileArg) {
    const value = profileArg.split('=')[1]?.trim()
    return value || null
  }

  const profileIndex = argv.findIndex(arg => arg === '--profile' || arg === '-p')

  if (profileIndex >= 0) {
    return argv[profileIndex + 1]?.trim() || null
  }

  return null
}

function printProfiles(runnerConfig) {
  console.log('Profils integres:\n')

  for (const profileName of Object.keys(builtInProfiles)) {
    console.log(`- ${profileName}: ${profileDescriptions[profileName]}`)
  }

  const savedProfileNames = Object.keys(runnerConfig.configs ?? {})

  if (savedProfileNames.length > 0) {
    console.log('\nConfigs enregistrees (config-runner.json):\n')
    for (const profileName of savedProfileNames) {
      console.log(`- ${profileName}`)
    }
  } else {
    console.log('\nConfigs enregistrees (config-runner.json): aucune')
  }

  console.log('\nExemples:')
  console.log('npm run launch -- --profile full')
  console.log('npm run launch -- --profile hp')
  console.log('npm run launch -- --config')
}

function printHelp(runnerConfig) {
  console.log('Usage: node scripts/launch-dev.mjs [options]\n')
  console.log('Options:')
  console.log('  -c, --config             Ouvre le menu lot-par-lot et sauvegarde dans config-runner.json')
  console.log('  -r, --reconfigure        Alias de --config')
  console.log('  -l, --list               Affiche les profils integres + configs enregistrees')
  console.log('  -p, --profile <name>     Applique un profil puis lance')
  console.log('      --profile=<name>     Variante equivalente')
  console.log('  -h, --help               Affiche cette aide')
  console.log('')
  printProfiles(runnerConfig)
}

function normalizeYesNo(input, fallbackValue) {
  const value = input.trim().toLowerCase()

  if (value === '') {
    return fallbackValue
  }

  if (['y', 'yes', 'o', 'oui', '1'].includes(value)) {
    return true
  }

  if (['n', 'no', 'non', '0'].includes(value)) {
    return false
  }

  return null
}

async function askYesNo(rl, label, defaultValue) {
  while (true) {
    const suffix = defaultValue ? 'Y/n' : 'y/N'
    const answer = await rl.question(`${label} (${suffix}) `)
    const normalized = normalizeYesNo(answer, defaultValue)

    if (normalized !== null) {
      return normalized
    }

    console.log('Reponse invalide. Utilise y ou n.')
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function loadConfig() {
  if (await fileExists(CONFIG_PATH)) {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      ...defaultRunnerConfig(),
      ...parsed,
      configs: parsed?.configs ?? {}
    }
  }

  if (await fileExists(LEGACY_CONFIG_PATH)) {
    const rawLegacy = await readFile(LEGACY_CONFIG_PATH, 'utf8')
    const legacyConfig = JSON.parse(rawLegacy)
    const migrated = defaultRunnerConfig()

    migrated.configs.last = mergeConfig(defaultConfig, legacyConfig)
    migrated.lastProfile = 'last'

    await saveConfig(migrated)
    return migrated
  }

  return defaultRunnerConfig()
}

async function saveConfig(runnerConfig) {
  await writeFile(CONFIG_PATH, `${JSON.stringify(runnerConfig, null, 2)}\n`, 'utf8')
}

async function configure(runnerConfig, existingLaunchConfig) {
  const rl = createInterface({ input: stdin, output: stdout })

  try {
    const base = mergeConfig(defaultConfig, existingLaunchConfig)
    const enabledLots = []

    console.log('\nMenu lots:')
    for (const lotKey of lotKeys) {
      const isEnabled = await askYesNo(rl, `Activer ${lotLabels[lotKey]}`, base.domains[lotKey])
      if (isEnabled) {
        enabledLots.push(lotKey)
      }
    }

    const stopPortsBeforeLaunch = await askYesNo(rl, 'Executer stop:ports avant le lancement', base.stopPortsBeforeLaunch)
    const suggestedName = runnerConfig.lastProfile || 'custom'
    const rawProfileName = await rl.question(`Nom de la config a enregistrer [${suggestedName}] `)
    const profileName = rawProfileName.trim() || suggestedName

    if (Object.prototype.hasOwnProperty.call(builtInProfiles, profileName)) {
      console.log(`Nom reserve (${profileName}), sauvegarde sous ${profileName}-custom`) 
    }

    const safeProfileName = Object.prototype.hasOwnProperty.call(builtInProfiles, profileName)
      ? `${profileName}-custom`
      : profileName

    const launchConfig = mergeConfig(createLotProfile(enabledLots), {
      stopPortsBeforeLaunch
    })

    runnerConfig.configs[safeProfileName] = launchConfig
    runnerConfig.lastProfile = safeProfileName

    await saveConfig(runnerConfig)

    return {
      launchConfig,
      profileName: safeProfileName
    }
  } finally {
    rl.close()
  }
}

function getLaunchConfigForProfile(profileName, runnerConfig) {
  if (profileName && builtInProfiles[profileName]) {
    return mergeConfig(defaultConfig, builtInProfiles[profileName])
  }

  if (profileName && runnerConfig.configs[profileName]) {
    return mergeConfig(defaultConfig, runnerConfig.configs[profileName])
  }

  return null
}

function startProcess(name, scriptName, env = {}) {
  console.log(`\n[start] ${name} -> npm run ${scriptName}`)

  const child = spawn('npm', ['run', scriptName], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    detached: true
  })

  child.on('error', error => {
    console.error(`[error] Impossible de lancer ${name}:`, error)
  })

  return { name, child }
}

function killProcess(entry) {
  const pid = entry.child.pid

  if (!pid) {
    return
  }

  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      entry.child.kill('SIGTERM')
    } catch {
      // ignore
    }
  }
}

async function main() {
  const runnerConfig = await loadConfig()

  if (showHelpOnly) {
    printHelp(runnerConfig)
    return
  }

  if (listProfilesOnly) {
    printProfiles(runnerConfig)
    return
  }

  const requestedProfileName = getProfileName() ?? runnerConfig.lastProfile ?? 'full'
  let config = getLaunchConfigForProfile(requestedProfileName, runnerConfig)
  let activeProfileName = requestedProfileName

  if (!config) {
    console.error(`Profil inconnu: ${requestedProfileName}`)
    printProfiles(runnerConfig)
    process.exit(1)
  }

  if (openConfigMenu) {
    const configured = await configure(runnerConfig, config)
    config = configured.launchConfig
    activeProfileName = configured.profileName
  } else {
    runnerConfig.lastProfile = activeProfileName
    await saveConfig(runnerConfig)
  }

  console.log(`\n[config] Profil actif: ${activeProfileName}`)

  if (config.stopPortsBeforeLaunch) {
    console.log('\n[setup] Execution de npm run stop:ports')
    const stopPorts = spawnSync('npm', ['run', 'stop:ports'], {
      stdio: 'inherit',
      env: process.env
    })

    if (stopPorts.status !== 0) {
      process.exit(stopPorts.status ?? 1)
    }
  }

  const processes = []

  if (config.backendUnified) {
    processes.push(
      startProcess('backend-unified', 'dev:backend', {
        ENABLE_HP: String(config.domains.hp),
        ENABLE_L7R: String(config.domains.l7r),
        ENABLE_JDR: String(config.domains.jdr),
        ENABLE_GHOST: String(config.domains.ghost),
        ENABLE_YEARDIARY: String(config.domains.yeardiary)
      })
    )
  }

  if (config.frontendShell) {
    processes.push(startProcess('frontend-shell', 'dev:frontend'))
  }

  if (config.ghostLegacy) {
    processes.push(startProcess('ghost-legacy', 'start:ghost'))
  }

  if (processes.length === 0) {
    console.log('\nAucun service selectionne. Relance avec --config pour definir la configuration.')
    return
  }

  console.log(`\nConfiguration chargee depuis ${CONFIG_PATH}`)
  console.log('Utilise Ctrl+C pour tout arreter.\n')

  let shuttingDown = false
  let exitCode = 0

  const shutdown = signal => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true
    console.log(`\n[stop] Signal recu: ${signal}. Arret des processus...`)

    for (const entry of processes) {
      killProcess(entry)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  let exitedCount = 0

  for (const entry of processes) {
    entry.child.on('exit', code => {
      exitedCount += 1

      if (!shuttingDown && code && code !== 0) {
        exitCode = code
        console.error(`[error] ${entry.name} termine avec code ${code}`)
        shutdown('child-exit')
      }

      if (exitedCount === processes.length) {
        process.exit(exitCode)
      }
    })
  }
}

main().catch(error => {
  console.error('Erreur du launcher:', error)
  process.exit(1)
})
