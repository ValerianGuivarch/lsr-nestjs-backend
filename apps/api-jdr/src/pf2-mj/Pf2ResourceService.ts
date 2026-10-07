import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataSource, EntityManager } from 'typeorm'

export type Pf2ResourceTargetKind = 'campaign' | 'scenario' | 'component'

export type Pf2ResourceLink = {
  targetKind: Pf2ResourceTargetKind
  targetId: string
  componentId: string | null
  sortOrder: number
}

export type Pf2ResourceFile = {
  id: string
  resourceId: string
  filename: string
  label: string
  mimeType: string
  sizeBytes: number
  sortOrder: number
  createdAt: string
  downloadUrl: string
}

export type Pf2Resource = {
  id: string
  title: string
  nom_vo: string
  description: string
  summary: string
  origin: string
  favorite: boolean
  tags: string[]
  files: Pf2ResourceFile[]
  links: Pf2ResourceLink[]
  createdAt: string
  updatedAt: string
}

type ResourceInput = {
  title?: unknown
  nom_vo?: unknown
  description?: unknown
  summary?: unknown
  origin?: unknown
  favorite?: unknown
  tags?: unknown
  links?: unknown
}

type ResourceRow = {
  id: string
  title: string
  nom_vo: string
  description: string
  summary: string
  origin: string
  favorite: number
  tags: string
  created_at: string
  updated_at: string
}

type ResourceFileRow = {
  id: string
  resource_id: string
  stored_name: string
  original_name: string
  label: string
  mime_type: string
  size_bytes: number
  sort_order: number
  created_at: string
}

type ResourceLinkRow = {
  resource_id: string
  target_kind: Pf2ResourceTargetKind
  target_id: string
  component_id: string
  sort_order: number
}

@Injectable()
export class Pf2ResourceService {
  private readonly root = resolve(process.env['STORAGE_PATH'] ?? 'storage', 'pf2-resources')

  constructor(@InjectDataSource('pf2-sqlite') private readonly dataSource: DataSource) {}

  async list(filters: { q?: string; tag?: string; origin?: string; targetKind?: string; targetId?: string; componentId?: string } = {}): Promise<Pf2Resource[]> {
    const resources = await this.all()
    const q = this.fold(filters.q)
    const tag = this.fold(filters.tag)
    const origin = this.fold(filters.origin)
    const targetKind = this.targetKind(filters.targetKind)
    const targetId = this.text(filters.targetId)
    const componentId = this.text(filters.componentId)

    return resources.filter((resource) => {
      if (q) {
        const haystack = this.fold([resource.title, resource.nom_vo, resource.description, resource.summary, resource.origin, ...resource.tags].join(' '))
        if (!haystack.includes(q)) return false
      }
      if (tag && !resource.tags.some((value) => this.fold(value) === tag)) return false
      if (origin && this.fold(resource.origin) !== origin) return false
      if (targetId) {
        const matches = resource.links.some((link) =>
          link.targetId === targetId
          && (!targetKind || link.targetKind === targetKind)
          && (!componentId || link.componentId === componentId)
        )
        if (!matches) return false
      }
      return true
    })
  }

  async get(id: string): Promise<Pf2Resource> {
    const rows = await this.dataSource.query('SELECT * FROM pf2_resource WHERE id = ? LIMIT 1', [id]) as ResourceRow[]
    if (!rows[0]) throw new NotFoundException('Ressource introuvable.')
    return this.hydrate(rows[0])
  }

  async create(input: ResourceInput): Promise<Pf2Resource> {
    const normalized = this.normalizeInput(input)
    const id = randomUUID()
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'INSERT INTO pf2_resource (id, title, nom_vo, description, summary, origin, favorite, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [id, normalized.title, normalized.nom_vo, normalized.description, normalized.summary, normalized.origin, normalized.favorite ? 1 : 0, JSON.stringify(normalized.tags)],
      )
      await this.replaceLinks(manager, id, normalized.links)
    })
    return this.get(id)
  }

  async update(id: string, input: ResourceInput): Promise<Pf2Resource> {
    await this.get(id)
    const normalized = this.normalizeInput(input)
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'UPDATE pf2_resource SET title = ?, nom_vo = ?, description = ?, summary = ?, origin = ?, favorite = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [normalized.title, normalized.nom_vo, normalized.description, normalized.summary, normalized.origin, normalized.favorite ? 1 : 0, JSON.stringify(normalized.tags), id],
      )
      await this.replaceLinks(manager, id, normalized.links)
    })
    return this.get(id)
  }

  async remove(id: string): Promise<void> {
    await this.get(id)
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM pf2_resource_link WHERE resource_id = ?', [id])
      await manager.query('DELETE FROM pf2_resource_file WHERE resource_id = ?', [id])
      await manager.query('DELETE FROM pf2_resource WHERE id = ?', [id])
    })
    await rm(this.resourceDirectory(id), { recursive: true, force: true })
  }

  async addFile(resourceId: string, filename: string, bytes: Buffer, label?: string): Promise<Pf2ResourceFile> {
    await this.get(resourceId)
    if (!filename.toLocaleLowerCase().endsWith('.pdf')) throw new BadRequestException('Seuls les PDF sont acceptés pour une ressource.')
    const id = randomUUID()
    const storedName = `${id}.pdf`
    const directory = this.resourceDirectory(resourceId)
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(directory, storedName), bytes)
    const countRows = await this.dataSource.query('SELECT COUNT(*) AS count FROM pf2_resource_file WHERE resource_id = ?', [resourceId]) as Array<{ count: number }>
    const sortOrder = Number(countRows[0]?.count ?? 0)
    await this.dataSource.query(
      'INSERT INTO pf2_resource_file (id, resource_id, stored_name, original_name, label, mime_type, size_bytes, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, resourceId, storedName, basename(filename), this.text(label) || basename(filename), 'application/pdf', bytes.byteLength, sortOrder],
    )
    await this.dataSource.query('UPDATE pf2_resource SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [resourceId])
    const resource = await this.get(resourceId)
    return resource.files.find((file) => file.id === id)!
  }

  async removeFile(resourceId: string, fileId: string): Promise<void> {
    const file = await this.fileRecord(resourceId, fileId)
    await this.dataSource.query('DELETE FROM pf2_resource_file WHERE id = ? AND resource_id = ?', [fileId, resourceId])
    await rm(resolve(this.resourceDirectory(resourceId), file.stored_name), { force: true })
    await this.dataSource.query('UPDATE pf2_resource SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [resourceId])
  }

  async readResourceFile(resourceId: string, fileId: string): Promise<{ bytes: Buffer; filename: string; mimeType: string }> {
    const file = await this.fileRecord(resourceId, fileId)
    const bytes = await readFile(resolve(this.resourceDirectory(resourceId), file.stored_name))
    return { bytes, filename: file.original_name, mimeType: file.mime_type || 'application/pdf' }
  }

  async export(): Promise<Record<string, unknown>> {
    return {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      resources: await this.all(),
    }
  }

  private async all(): Promise<Pf2Resource[]> {
    const rows = await this.dataSource.query('SELECT * FROM pf2_resource ORDER BY title COLLATE NOCASE, id') as ResourceRow[]
    if (!rows.length) return []
    const files = await this.dataSource.query('SELECT * FROM pf2_resource_file ORDER BY resource_id, sort_order, created_at, id') as ResourceFileRow[]
    const links = await this.dataSource.query('SELECT * FROM pf2_resource_link ORDER BY resource_id, sort_order, target_kind, target_id, component_id') as ResourceLinkRow[]
    return rows.map((row) => this.hydrateFrom(row, files.filter((file) => file.resource_id === row.id), links.filter((link) => link.resource_id === row.id)))
  }

  private async hydrate(row: ResourceRow): Promise<Pf2Resource> {
    const files = await this.dataSource.query('SELECT * FROM pf2_resource_file WHERE resource_id = ? ORDER BY sort_order, created_at, id', [row.id]) as ResourceFileRow[]
    const links = await this.dataSource.query('SELECT * FROM pf2_resource_link WHERE resource_id = ? ORDER BY sort_order, target_kind, target_id, component_id', [row.id]) as ResourceLinkRow[]
    return this.hydrateFrom(row, files, links)
  }

  private hydrateFrom(row: ResourceRow, files: ResourceFileRow[], links: ResourceLinkRow[]): Pf2Resource {
    let tags: string[] = []
    try {
      const raw = JSON.parse(row.tags)
      if (Array.isArray(raw)) tags = raw.filter((value): value is string => typeof value === 'string')
    } catch {
      tags = []
    }
    return {
      id: row.id,
      title: row.title,
      nom_vo: row.nom_vo,
      description: row.description,
      summary: row.summary,
      origin: row.origin,
      favorite: Boolean(row.favorite),
      tags,
      files: files.map((file) => ({
        id: file.id,
        resourceId: file.resource_id,
        filename: file.original_name,
        label: file.label,
        mimeType: file.mime_type,
        sizeBytes: Number(file.size_bytes),
        sortOrder: Number(file.sort_order),
        createdAt: file.created_at,
        downloadUrl: `/apil7r/pf2-mj/resources/${encodeURIComponent(row.id)}/files/${encodeURIComponent(file.id)}`,
      })),
      links: links.map((link) => ({
        targetKind: link.target_kind,
        targetId: link.target_id,
        componentId: link.component_id || null,
        sortOrder: Number(link.sort_order),
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private normalizeInput(input: ResourceInput): { title: string; nom_vo: string; description: string; summary: string; origin: string; favorite: boolean; tags: string[]; links: Pf2ResourceLink[] } {
    const title = this.text(input.title)
    if (!title) throw new BadRequestException('Le titre de la ressource est obligatoire.')
    const tagsRaw = Array.isArray(input.tags) ? input.tags : typeof input.tags === 'string' ? input.tags.split(',') : []
    const tags = [...new Map(tagsRaw.map((value) => this.text(value)).filter(Boolean).map((value) => [this.fold(value), value])).values()]
      .sort((left, right) => left.localeCompare(right, 'fr'))
    const links = Array.isArray(input.links) ? input.links.flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
      const link = raw as Record<string, unknown>
      const targetKind = this.targetKind(link.targetKind)
      const targetId = this.text(link.targetId)
      if (!targetKind || !targetId) return []
      const componentId = targetKind === 'component' ? this.text(link.componentId) : ''
      if (targetKind === 'component' && !componentId) return []
      return [{ targetKind, targetId, componentId: componentId || null, sortOrder: index }]
    }) : []
    const dedupedLinks = [...new Map(links.map((link) => [`${link.targetKind}\0${link.targetId}\0${link.componentId ?? ''}`, link])).values()]
      .map((link, index) => ({ ...link, sortOrder: index }))
    return {
      title,
      nom_vo: this.text(input.nom_vo),
      description: this.text(input.description),
      summary: this.text(input.summary),
      origin: this.text(input.origin),
      favorite: input.favorite === true || input.favorite === 1 || input.favorite === '1' || input.favorite === 'true',
      tags,
      links: dedupedLinks,
    }
  }

  private async replaceLinks(manager: EntityManager, resourceId: string, links: Pf2ResourceLink[]): Promise<void> {
    await manager.query('DELETE FROM pf2_resource_link WHERE resource_id = ?', [resourceId])
    for (const link of links) {
      await manager.query(
        'INSERT INTO pf2_resource_link (resource_id, target_kind, target_id, component_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [resourceId, link.targetKind, link.targetId, link.componentId ?? '', link.sortOrder],
      )
    }
  }

  private async fileRecord(resourceId: string, fileId: string): Promise<ResourceFileRow> {
    const rows = await this.dataSource.query('SELECT * FROM pf2_resource_file WHERE resource_id = ? AND id = ? LIMIT 1', [resourceId, fileId]) as ResourceFileRow[]
    if (!rows[0]) throw new NotFoundException('PDF de ressource introuvable.')
    return rows[0]
  }

  private resourceDirectory(resourceId: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(resourceId)) throw new BadRequestException('Identifiant de ressource invalide.')
    return resolve(this.root, resourceId)
  }

  private targetKind(value: unknown): Pf2ResourceTargetKind | null {
    return value === 'campaign' || value === 'scenario' || value === 'component' ? value : null
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  private fold(value: unknown): string {
    return this.text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
  }
}
