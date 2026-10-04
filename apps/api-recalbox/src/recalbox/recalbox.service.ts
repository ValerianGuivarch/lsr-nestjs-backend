import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface RecalboxSystemSummary {
  name: string
  fullName: string
  manufacturer: string
  type: number
}

export interface RecalboxGameSummary {
  path: string
  name: string
  publisher: string
  developer: string
  genre: string
  players: number
  rating: number
  favorite: boolean
}

export interface RecalboxGameMetadata {
  name: string
  synopsys: string
  publisher: string
  developer: string
  releaseDate: number
  regions: string
  favorite: boolean
  hidden: boolean
  rating: number
  players: { min: number; max: number }
  genres: { free: string; normalized: number }
  availableMedia: { hasImage: boolean; hasBox: boolean; hasVideo: boolean }
}

export interface UpdateGameMetadata {
  path: string
  name?: string
  description?: string
  publisher?: string
  developer?: string
  genre?: string
  players?: number
  favorite?: boolean
  hidden?: boolean
}

interface GamelistEntry {
  path: string
  name?: string
  description?: string
  publisher?: string
  developer?: string
  genre?: string
  players?: number
  favorite?: boolean
  hidden?: boolean
}

@Injectable()
export class RecalboxService {
  private readonly host = process.env['RECALBOX_HOST'] ?? '192.168.1.3'
  private readonly apiBase = `http://${this.host}:81/api`
  private readonly smbTarget = `//${this.host}/share`

  async systems(): Promise<RecalboxSystemSummary[]> {
    const body = await this.fetchJson<{ systems?: Array<Record<string, unknown>> }>('/systems')
    return (body.systems ?? [])
      .filter((system) => {
        const properties = system['properties'] as { isReadOnly?: boolean } | undefined
        const paths = Array.isArray(system['romPath']) ? (system['romPath'] as string[]) : []
        return properties?.isReadOnly !== true && paths.some((path) => path.includes('/recalbox/share/roms/'))
      })
      .map((system) => ({
        name: String(system['name'] ?? ''),
        fullName: String(system['fullName'] ?? system['name'] ?? ''),
        manufacturer: String(system['manufacturer'] ?? ''),
        type: Number(system['type'] ?? 0)
      }))
      .filter((system) => system.name)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
  }

  async games(system: string): Promise<RecalboxGameSummary[]> {
    this.assertSystem(system)
    const body = await this.fetchJson<{ roms?: RecalboxGameSummary[] }>(`/systems/${encodeURIComponent(system)}/roms`)
    const gamelist = await this.readGamelistEntries(system)

    return [...(body.roms ?? [])]
      .map((game) => {
        const file = gamelist.get(game.path)
        if (!file) return game
        return {
          ...game,
          name: file.name ?? game.name,
          publisher: file.publisher ?? game.publisher,
          developer: file.developer ?? game.developer,
          genre: file.genre ?? game.genre,
          players: file.players ?? game.players,
          favorite: file.favorite ?? game.favorite
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  async metadata(system: string, romPath: string): Promise<RecalboxGameMetadata> {
    this.assertRomPath(system, romPath)
    const [native, gamelist] = await Promise.all([
      this.fetchJson<RecalboxGameMetadata>(
        `/systems/${encodeURIComponent(system)}/roms/metadata/info/${encodeURIComponent(romPath)}`
      ),
      this.readGamelistEntries(system)
    ])
    const file = gamelist.get(romPath)
    if (!file) return native

    return {
      ...native,
      name: file.name ?? native.name,
      synopsys: file.description ?? native.synopsys,
      publisher: file.publisher ?? native.publisher,
      developer: file.developer ?? native.developer,
      favorite: file.favorite ?? native.favorite,
      hidden: file.hidden ?? native.hidden,
      players: file.players === undefined ? native.players : { min: file.players, max: file.players },
      genres: {
        ...native.genres,
        free: file.genre ?? native.genres.free
      }
    }
  }

  async updateMetadata(system: string, update: UpdateGameMetadata): Promise<{ saved: true; backup: string }> {
    this.assertRomPath(system, update.path)
    const romName = basename(update.path)
    const remoteGamelist = `roms/${system}/gamelist.xml`
    const workspace = await mkdtemp(join(tmpdir(), 'recalbox-gamelist-'))
    const localOriginal = join(workspace, 'gamelist.xml')
    const localUpdated = join(workspace, 'gamelist.updated.xml')
    const backupName = `gamelist.web-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.xml`

    try {
      await this.smb(['get', remoteGamelist, localOriginal])
      const original = await readFile(localOriginal, 'utf8')
      const updated = this.patchGame(original, romName, update)
      await writeFile(localUpdated, updated, 'utf8')

      await this.smb(['put', localOriginal, `roms/${system}/${backupName}`])
      await this.smb(['put', localUpdated, remoteGamelist])

      return { saved: true, backup: `roms/${system}/${backupName}` }
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }

  private async fetchJson<T>(path: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.apiBase}${path}`, { signal: AbortSignal.timeout(8000) })
    } catch {
      throw new BadGatewayException('La Recalbox est injoignable.')
    }

    if (!response.ok) {
      throw new BadGatewayException(`La Recalbox a répondu ${response.status}.`)
    }

    return (await response.json()) as T
  }

  private async readGamelistEntries(system: string): Promise<Map<string, GamelistEntry>> {
    const entries = new Map<string, GamelistEntry>()
    const workspace = await mkdtemp(join(tmpdir(), 'recalbox-gamelist-read-'))
    const local = join(workspace, 'gamelist.xml')

    try {
      try {
        await this.smb(['get', `roms/${system}/gamelist.xml`, local])
      } catch {
        return entries
      }

      const xml = await readFile(local, 'utf8')
      for (const block of xml.match(/<game\b[^>]*>[\s\S]*?<\/game>/g) ?? []) {
        const relativePath = this.decodeXml(this.readTag(block, 'path')).replace(/^\.\//, '')
        if (!relativePath) continue
        const absolutePath = `/recalbox/share/roms/${system}/${relativePath}`
        const players = this.optionalTag(block, 'players')
        const favorite = this.optionalTag(block, 'favorite')
        const hidden = this.optionalTag(block, 'hidden')

        entries.set(absolutePath, {
          path: absolutePath,
          name: this.optionalDecodedTag(block, 'name'),
          description: this.optionalDecodedTag(block, 'desc'),
          publisher: this.optionalDecodedTag(block, 'publisher'),
          developer: this.optionalDecodedTag(block, 'developer'),
          genre: this.optionalDecodedTag(block, 'genre'),
          players: players === undefined ? undefined : Number(players) || 1,
          favorite: favorite === undefined ? undefined : favorite === 'true' || favorite === '1',
          hidden: hidden === undefined ? undefined : hidden === 'true' || hidden === '1'
        })
      }
      return entries
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }

  private assertSystem(system: string): void {
    if (!/^[a-z0-9_-]+$/i.test(system)) throw new BadRequestException('Console invalide.')
  }

  private assertRomPath(system: string, romPath: string): void {
    this.assertSystem(system)
    const prefix = `/recalbox/share/roms/${system}/`
    if (!romPath.startsWith(prefix) || romPath.includes('/../')) {
      throw new BadRequestException('Chemin de ROM invalide.')
    }
  }

  private async smb(args: ['get' | 'put', string, string]): Promise<void> {
    const [operation, source, destination] = args
    const command =
      operation === 'get'
        ? `get "${this.escapeSmb(source)}" "${this.escapeSmb(destination)}"`
        : `put "${this.escapeSmb(source)}" "${this.escapeSmb(destination)}"`

    try {
      await execFileAsync('smbclient', ['-t', '20', this.smbTarget, '-N', '-c', command], {
        timeout: 25000,
        maxBuffer: 1024 * 1024
      })
    } catch {
      throw new BadGatewayException('Impossible de lire ou modifier les métadonnées via Samba.')
    }
  }

  private escapeSmb(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }

  private patchGame(xml: string, romName: string, update: UpdateGameMetadata): string {
    const gameExpression = /<game\b[^>]*>[\s\S]*?<\/game>/g
    let found = false

    const result = xml.replace(gameExpression, (block) => {
      const path = this.readTag(block, 'path')
      if (this.decodeXml(path).replace(/^\.\//, '') !== romName) return block

      found = true
      let next = block
      next = this.writeTag(next, 'name', update.name)
      next = this.writeTag(next, 'desc', update.description)
      next = this.writeTag(next, 'publisher', update.publisher)
      next = this.writeTag(next, 'developer', update.developer)
      next = this.writeTag(next, 'genre', update.genre)
      next = this.writeTag(next, 'players', update.players === undefined ? undefined : String(update.players))
      next = this.writeTag(next, 'favorite', update.favorite === undefined ? undefined : String(update.favorite))
      next = this.writeTag(next, 'hidden', update.hidden === undefined ? undefined : String(update.hidden))
      return next
    })

    if (!found) throw new NotFoundException('Jeu introuvable dans gamelist.xml.')
    return result
  }

  private readTag(block: string, tag: string): string {
    return block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? ''
  }

  private optionalTag(block: string, tag: string): string | undefined {
    const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
    return match?.[1]
  }

  private optionalDecodedTag(block: string, tag: string): string | undefined {
    const value = this.optionalTag(block, tag)
    return value === undefined ? undefined : this.decodeXml(value)
  }

  private writeTag(block: string, tag: string, value: string | undefined): string {
    if (value === undefined) return block

    const expression = new RegExp(`\\n([ \\t]*)<${tag}>[\\s\\S]*?<\\/${tag}>`)
    if (value === '') return block.replace(expression, '')

    const encoded = this.encodeXml(value)
    if (expression.test(block)) {
      return block.replace(expression, (_match, indentation: string) => `\n${indentation}<${tag}>${encoded}</${tag}>`)
    }

    const pathMatch = block.match(/\n([ \t]*)<path>/)
    const indentation = pathMatch?.[1] ?? '\t\t'
    return block.replace(/\n([ \t]*)<\/game>$/, `\n${indentation}<${tag}>${encoded}</${tag}>\n\t</game>`)
  }

  private encodeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
  }
}
