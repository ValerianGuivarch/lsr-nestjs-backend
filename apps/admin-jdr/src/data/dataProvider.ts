import { CreateParams, DataProvider, DeleteParams, GetListParams, GetOneParams, RaRecord, UpdateParams } from 'react-admin'
import { jdrApi } from './jdrApi'
import { jdrAggregateStore } from './aggregateStore'
import {
  CharacterEntity,
  ClassEntity,
  ClassResourceEntity,
  GameResourceEntity,
  GroupEntity,
  ItemEntity,
  JdrAggregate,
  OwnedItemEntity,
  StatEntity,
  TraitEntity
} from './types'

function applyListParams<T extends RaRecord>(records: T[], params: GetListParams): { data: T[]; total: number } {
  const { filter = {} } = params
  const filtered = records.filter((record) =>
    Object.entries(filter).every(([key, value]) => {
      if (value === undefined || value === '') return true
      const recordValue = (record as Record<string, unknown>)[key]
      if (typeof recordValue === 'string' && typeof value === 'string') {
        return recordValue.toLowerCase().includes(value.toLowerCase())
      }
      return recordValue === value
    })
  )

  const { field, order } = params.sort ?? { field: 'id', order: 'ASC' }
  const sorted = [...filtered].sort((a, b) => {
    const av = (a as Record<string, unknown>)[field]
    const bv = (b as Record<string, unknown>)[field]
    if (av === bv) return 0
    const cmp = av! > bv! ? 1 : -1
    return order === 'DESC' ? -cmp : cmp
  })

  const { page, perPage } = params.pagination ?? { page: 1, perPage: 1000 }
  const start = (page - 1) * perPage
  return { data: sorted.slice(start, start + perPage), total: sorted.length }
}

/** Returns the cached aggregate for the selected JdR, or null if none is selected yet. */
async function getAggregateOrNull(): Promise<JdrAggregate | null> {
  if (!jdrAggregateStore.getSelectedSlug()) return null
  return jdrAggregateStore.getAggregate()
}

function requireSlug(): string {
  const slug = jdrAggregateStore.getSelectedSlug()
  if (!slug) throw new Error('Aucun JdR sélectionné')
  return slug
}

/** Finds the id(s) present in `after` but not in `before` - used to identify a just-created record. */
function newIds(before: string[], after: string[]): string[] {
  const beforeSet = new Set(before)
  return after.filter((id) => !beforeSet.has(id))
}

// --- Nested-resource record mappers (aggregate entity -> react-admin record with `id`) ---

const toStatRecord = (e: StatEntity) => ({ id: e.slug, ...e })
const toTraitRecord = (e: TraitEntity) => ({ id: e.slug, ...e })
const toGameResourceRecord = (e: GameResourceEntity, aggregate: JdrAggregate) => ({
  id: e.slug,
  ...e,
  groupValue: aggregate.groupResources.find((gr) => gr.resourceSlug === e.slug)?.value ?? 0
})
const toItemRecord = (e: ItemEntity, aggregate: JdrAggregate) => ({
  id: e.slug,
  ...e,
  groupQuantity: aggregate.groupItems.find((gi) => gi.itemSlug === e.slug)?.quantity ?? 0
})
const toClassRecord = (e: ClassEntity) => ({ id: e.slug, ...e })
const toGroupRecord = (e: GroupEntity) => ({ id: e.slug, ...e })
const toCharacterRecord = (e: CharacterEntity) => ({ id: e.slug, ...e })

/** Full, unfiltered/unsorted set of records for a resource - the shared basis for getList/getOne/getMany. */
async function fetchAllRecords(resource: string): Promise<RaRecord[]> {
  if (resource === 'jdrs') {
    const jdrs = await jdrApi.findAll()
    return jdrs.map((j) => ({ id: j.slug, ...j }))
  }

  const aggregate = await getAggregateOrNull()
  if (!aggregate) return []

  switch (resource) {
    case 'stats':
      return aggregate.stats.map(toStatRecord)
    case 'traits':
      return aggregate.traits.map(toTraitRecord)
    case 'resources':
      return aggregate.resources.map((e) => toGameResourceRecord(e, aggregate))
    case 'items':
      return aggregate.items.map((e) => toItemRecord(e, aggregate))
    case 'classes':
      return aggregate.classes.map(toClassRecord)
    case 'groups':
      return aggregate.groups.map(toGroupRecord)
    case 'characters':
      return aggregate.characters.map(toCharacterRecord)
    case 'rolls': {
      const rolls = await jdrApi.getLastRolls(aggregate.slug)
      return rolls.map((r) => ({ id: r.id, ...r }))
    }
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
}

export const dataProvider: DataProvider = {
  async getList(resource, params) {
    return applyListParams(await fetchAllRecords(resource), params)
  },

  async getOne(resource, params: GetOneParams) {
    if (resource === 'jdrs') {
      const jdr = await jdrApi.findOne(String(params.id))
      return { data: { id: jdr.slug, slug: jdr.slug, name: jdr.name, text: jdr.text } }
    }

    const data = await fetchAllRecords(resource)
    const record = data.find((r) => String(r.id) === String(params.id))
    if (!record) throw new Error(`${resource} ${params.id} not found`)
    return { data: record }
  },

  async getMany(resource, params) {
    const data = await fetchAllRecords(resource)
    return { data: data.filter((r) => params.ids.some((id) => String(id) === String(r.id))) }
  },

  async getManyReference(resource, params) {
    return applyListParams(await fetchAllRecords(resource), params)
  },

  async create(resource, params: CreateParams) {
    if (resource === 'jdrs') {
      const before = (await jdrApi.findAll()).map((j) => j.slug)
      await jdrApi.createJdr(params.data)
      const after = await jdrApi.findAll()
      const [id] = newIds(before, after.map((j) => j.slug))
      const created = after.find((j) => j.slug === id)!
      return { data: { id: created.slug, ...created } }
    }

    const jdrSlug = requireSlug()
    const before = await jdrAggregateStore.getAggregate()

    let aggregate: JdrAggregate
    switch (resource) {
      case 'stats':
        aggregate = await jdrApi.addStat(jdrSlug, { name: params.data.name })
        break
      case 'traits':
        aggregate = await jdrApi.addTrait(jdrSlug, params.data)
        break
      case 'resources':
        aggregate = await jdrApi.addResource(jdrSlug, { name: params.data.name, type: params.data.type })
        break
      case 'items':
        aggregate = await jdrApi.addItem(jdrSlug, params.data)
        break
      case 'classes':
        aggregate = await jdrApi.addClass(jdrSlug, { name: params.data.name, level: params.data.level ?? 1, text: params.data.text })
        break
      case 'groups':
        aggregate = await jdrApi.addGroup(jdrSlug, { name: params.data.name, text: params.data.text })
        break
      case 'characters':
        aggregate = await jdrApi.addCharacter(jdrSlug, params.data)
        break
      default:
        throw new Error(`Create not supported for resource: ${resource}`)
    }

    jdrAggregateStore.setAggregate(aggregate)

    const beforeIds = getEntitiesOf(resource, before).map((e) => e.slug)
    const afterEntities = getEntitiesOf(resource, aggregate)
    const [newId] = newIds(beforeIds, afterEntities.map((e) => e.slug))
    const created = afterEntities.find((e) => e.slug === newId)!
    return { data: { id: created.slug, ...created } }
  },

  async update(resource, params: UpdateParams) {
    if (resource === 'jdrs') {
      const jdrSlug = String(params.id)
      const jdr = await jdrApi.updateJdr(jdrSlug, { name: params.data.name, text: params.data.text })
      if (jdrAggregateStore.getSelectedSlug() === jdrSlug) jdrAggregateStore.setAggregate(jdr)
      return { data: { id: jdr.slug, slug: jdr.slug, name: jdr.name, text: jdr.text } }
    }

    const jdrSlug = requireSlug()
    const id = String(params.id)
    let aggregate: JdrAggregate

    switch (resource) {
      case 'stats':
        aggregate = await jdrApi.updateStat(jdrSlug, id, { name: params.data.name })
        break
      case 'traits':
        aggregate = await jdrApi.updateTrait(jdrSlug, id, params.data)
        break
      case 'resources': {
        aggregate = await jdrApi.updateResource(jdrSlug, id, { name: params.data.name, type: params.data.type })
        const previousGroupValue = params.previousData?.groupValue ?? 0
        if (params.data.groupValue !== undefined && params.data.groupValue !== previousGroupValue) {
          aggregate = await jdrApi.updateGroupResource(jdrSlug, id, Number(params.data.groupValue))
        }
        break
      }
      case 'items': {
        aggregate = await jdrApi.updateItem(jdrSlug, id, params.data)
        const previousGroupQuantity = params.previousData?.groupQuantity ?? 0
        if (params.data.groupQuantity !== undefined && params.data.groupQuantity !== previousGroupQuantity) {
          if (Number(params.data.groupQuantity) > 0) {
            aggregate = await jdrApi.addGroupItem(jdrSlug, id, Number(params.data.groupQuantity))
          } else {
            aggregate = await jdrApi.removeGroupItem(jdrSlug, id)
          }
        }
        break
      }
      case 'classes':
        aggregate = await updateClass(jdrSlug, id, params)
        break
      case 'groups':
        aggregate = await jdrApi.updateGroup(jdrSlug, id, { name: params.data.name, text: params.data.text })
        break
      case 'characters':
        aggregate = await updateCharacter(jdrSlug, id, params)
        break
      default:
        throw new Error(`Update not supported for resource: ${resource}`)
    }

    jdrAggregateStore.setAggregate(aggregate)
    const entity = getEntitiesOf(resource, aggregate).find((e) => e.slug === id)
    if (!entity) throw new Error(`${resource} ${id} not found after update`)
    return { data: { id: entity.slug, ...entity } }
  },

  async updateMany() {
    throw new Error('updateMany is not supported')
  },

  async delete(resource, params: DeleteParams) {
    if (resource === 'jdrs') {
      const jdrSlug = String(params.id)
      await jdrApi.deleteJdr(jdrSlug)
      if (jdrAggregateStore.getSelectedSlug() === jdrSlug) jdrAggregateStore.setSelectedSlug(null)
      return { data: params.previousData as RaRecord }
    }

    const jdrSlug = requireSlug()
    const id = String(params.id)
    let aggregate: JdrAggregate

    switch (resource) {
      case 'stats':
        aggregate = await jdrApi.removeStat(jdrSlug, id)
        break
      case 'traits':
        aggregate = await jdrApi.removeTrait(jdrSlug, id)
        break
      case 'resources':
        aggregate = await jdrApi.removeResource(jdrSlug, id)
        break
      case 'items':
        aggregate = await jdrApi.removeItem(jdrSlug, id)
        break
      case 'classes':
        aggregate = await jdrApi.removeClass(jdrSlug, id)
        break
      case 'groups':
        aggregate = await jdrApi.removeGroup(jdrSlug, id)
        break
      case 'characters':
        aggregate = await jdrApi.removeCharacter(jdrSlug, id)
        break
      default:
        throw new Error(`Delete not supported for resource: ${resource}`)
    }

    jdrAggregateStore.setAggregate(aggregate)
    return { data: params.previousData as RaRecord }
  },

  async deleteMany() {
    throw new Error('deleteMany is not supported')
  }
}

function getEntitiesOf(resource: string, aggregate: JdrAggregate): { slug: string }[] {
  switch (resource) {
    case 'stats':
      return aggregate.stats
    case 'traits':
      return aggregate.traits
    case 'resources':
      return aggregate.resources
    case 'items':
      return aggregate.items
    case 'classes':
      return aggregate.classes
    case 'groups':
      return aggregate.groups
    case 'characters':
      return aggregate.characters
    default:
      return []
  }
}

// Class resources only support add/remove (no update endpoint), so a changed value is
// applied as a remove-then-re-add of that resourceSlug.
async function updateClass(jdrSlug: string, classSlug: string, params: UpdateParams): Promise<JdrAggregate> {
  let aggregate = await jdrApi.updateClass(jdrSlug, classSlug, { name: params.data.name, level: params.data.level, text: params.data.text })

  const previous: ClassResourceEntity[] = params.previousData?.resources ?? []
  const next: ClassResourceEntity[] = params.data.resources ?? []
  const previousBySlug = new Map(previous.map((r) => [r.resourceSlug, r]))
  const nextSlugs = new Set(next.map((r) => r.resourceSlug))

  for (const removed of previous.filter((r) => !nextSlugs.has(r.resourceSlug))) {
    aggregate = await jdrApi.removeClassResource(jdrSlug, classSlug, removed.resourceSlug)
  }

  for (const entry of next) {
    const before = previousBySlug.get(entry.resourceSlug)
    const changed = !before || before.resourceType !== entry.resourceType || before.defaultValue !== entry.defaultValue || before.behavior !== entry.behavior
    if (!changed) continue
    if (before) aggregate = await jdrApi.removeClassResource(jdrSlug, classSlug, entry.resourceSlug)
    aggregate = await jdrApi.addClassResource(jdrSlug, classSlug, entry)
  }

  return aggregate
}

// Character relations (groups, traits, items, resources, stats) are edited via link/unlink or
// update sub-endpoints rather than plain fields, so each is diffed against previousData in turn.
async function updateCharacter(jdrSlug: string, characterSlug: string, params: UpdateParams): Promise<JdrAggregate> {
  let aggregate = await jdrApi.updateCharacter(jdrSlug, characterSlug, {
    name: params.data.name,
    classSlug: params.data.classSlug || undefined,
    classLevel: params.data.classLevel,
    isPlayable: params.data.isPlayable,
    text: params.data.text
  })

  const previousGroupSlugs: string[] = params.previousData?.groupSlugs ?? []
  const nextGroupSlugs: string[] = params.data.groupSlugs ?? []
  for (const slug of previousGroupSlugs.filter((s) => !nextGroupSlugs.includes(s))) {
    aggregate = await jdrApi.removeCharacterGroup(jdrSlug, characterSlug, slug)
  }
  for (const slug of nextGroupSlugs.filter((s) => !previousGroupSlugs.includes(s))) {
    aggregate = await jdrApi.addCharacterGroup(jdrSlug, characterSlug, slug)
  }

  const previousTraitSlugs: string[] = params.previousData?.traitSlugs ?? []
  const nextTraitSlugs: string[] = params.data.traitSlugs ?? []
  for (const slug of previousTraitSlugs.filter((s) => !nextTraitSlugs.includes(s))) {
    aggregate = await jdrApi.removeCharacterTrait(jdrSlug, characterSlug, slug)
  }
  for (const slug of nextTraitSlugs.filter((s) => !previousTraitSlugs.includes(s))) {
    aggregate = await jdrApi.addCharacterTrait(jdrSlug, characterSlug, slug)
  }

  const previousItems: OwnedItemEntity[] = params.previousData?.items ?? []
  const nextItems: OwnedItemEntity[] = params.data.items ?? []
  const previousItemsBySlug = new Map(previousItems.map((i) => [i.itemSlug, i]))
  const nextItemSlugs = new Set(nextItems.map((i) => i.itemSlug))
  for (const removed of previousItems.filter((i) => !nextItemSlugs.has(i.itemSlug))) {
    aggregate = await jdrApi.removeCharacterItem(jdrSlug, characterSlug, removed.itemSlug)
  }
  for (const item of nextItems) {
    const before = previousItemsBySlug.get(item.itemSlug)
    if (before && before.quantity === item.quantity) continue
    if (before) aggregate = await jdrApi.removeCharacterItem(jdrSlug, characterSlug, item.itemSlug)
    aggregate = await jdrApi.addCharacterItem(jdrSlug, characterSlug, item.itemSlug, item.quantity)
  }

  const previousResources: { resourceSlug: string; value: number }[] = params.previousData?.resources ?? []
  const nextResources: { resourceSlug: string; value: number }[] = params.data.resources ?? []
  const previousResourcesBySlug = new Map(previousResources.map((r) => [r.resourceSlug, r]))
  const nextResourceSlugs = new Set(nextResources.map((r) => r.resourceSlug))
  for (const removed of previousResources.filter((r) => !nextResourceSlugs.has(r.resourceSlug))) {
    aggregate = await jdrApi.removeCharacterResource(jdrSlug, characterSlug, removed.resourceSlug)
  }
  for (const resource of nextResources) {
    const before = previousResourcesBySlug.get(resource.resourceSlug)
    if (before && before.value === resource.value) continue
    aggregate = await jdrApi.updateCharacterResource(jdrSlug, characterSlug, resource.resourceSlug, resource.value)
  }

  const previousStats: { statSlug: string; value: number }[] = params.previousData?.stats ?? []
  const nextStats: { statSlug: string; value: number }[] = params.data.stats ?? []
  const previousStatsBySlug = new Map(previousStats.map((s) => [s.statSlug, s]))
  for (const stat of nextStats) {
    const before = previousStatsBySlug.get(stat.statSlug)
    if (before && before.value === stat.value) continue
    aggregate = await jdrApi.updateCharacterStat(jdrSlug, characterSlug, stat.statSlug, stat.value)
  }

  return aggregate
}
