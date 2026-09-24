import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'
export type JournalDefinition = { number: number; title: string; content: string; dependencies: number[] }

export type JournalListItem = { number: number; title: string; revealed: boolean }
export type JournalView = JournalListItem & { content?: string; revealedAt?: string | null; revealedBy?: string | null }

@Injectable()
export class Pf2JournalsService {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  async list(): Promise<JournalListItem[]> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    return (await this.catalogue()).map(item => ({ number: item.number, title: item.title, revealed: revealed.has(item.number) }))
  }

  async view(number: number, canReadUnrevealed = false): Promise<JournalView> {
    const journal = await this.definition(number)
    const state = (await this.persistence.listJournalRevelations()).find(item => item.journalNumber === number) ?? null
    const revealed = Boolean(state)
    const result: JournalView = { number: journal.number, title: journal.title, revealed, revealedAt: state?.revealedAt ?? null, revealedBy: canReadUnrevealed ? state?.revealedBy ?? null : null }
    if (revealed || canReadUnrevealed) result.content = journal.content
    return result
  }

  async resolveJournalToReveal(targetNumber: number): Promise<JournalDefinition | null> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    const catalogue = await this.catalogueMap()
    return this.resolve(await this.definition(targetNumber), revealed, new Set(), catalogue)
  }

  async randomJournalToReveal(): Promise<JournalDefinition | null> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    const catalogue = await this.catalogueMap()
    const candidates = [...catalogue.values()].filter(item => !revealed.has(item.number))
    if (!candidates.length) return null
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    return this.resolve(chosen, revealed, new Set(), catalogue)
  }

  async claim(number: number, discordUserId: string): Promise<'claimed' | 'revealed' | 'busy'> {
    await this.definition(number)
    return this.persistence.claimJournalReveal(number, discordUserId)
  }
  async complete(number: number, discordUserId: string, discordMessageId: string): Promise<boolean> { return this.persistence.completeJournalReveal(number, discordUserId, discordMessageId) }
  async abandon(number: number, discordUserId: string): Promise<void> { await this.persistence.abandonJournalReveal(number, discordUserId) }

  async catalogueForAdmin(): Promise<JournalDefinition[]> { return this.catalogue() }
  async saveDefinition(input: unknown): Promise<JournalDefinition> {
    const definition = this.input(input); const catalogue = await this.catalogueMap(); catalogue.set(definition.number, definition); this.validateCatalogue(catalogue); await this.persistence.saveJournalDefinition(definition); return definition
  }
  async deleteDefinition(number: number): Promise<void> {
    const catalogue = await this.catalogueMap()
    if (!catalogue.has(number)) throw new NotFoundException(`Journal ${number} introuvable.`)
    if ([...catalogue.values()].some(item => item.dependencies.includes(number))) throw new BadRequestException(`Le journal ${number} est une dépendance : retire d’abord ce lien.`)
    await this.persistence.deleteJournalDefinition(number)
  }

  private async definition(number: number): Promise<JournalDefinition> {
    if (!Number.isInteger(number) || number < 1) throw new BadRequestException('Numéro de journal invalide.')
    const journal = (await this.catalogueMap()).get(number)
    if (!journal) throw new NotFoundException(`Journal ${number} introuvable.`)
    return journal
  }

  private resolve(journal: JournalDefinition, revealed: Set<number>, stack: Set<number>, catalogue: Map<number, JournalDefinition>): JournalDefinition | null {
    if (revealed.has(journal.number)) return null
    if (stack.has(journal.number)) throw new BadRequestException(`Dépendance circulaire détectée pour le journal ${journal.number}.`)
    stack.add(journal.number)
    for (const dependency of journal.dependencies) {
      const prerequisite = catalogue.get(dependency)
      if (!prerequisite) throw new BadRequestException(`Le journal ${journal.number} dépend du journal inexistant ${dependency}.`)
      if (!revealed.has(dependency)) {
        const resolved = this.resolve(prerequisite, revealed, stack, catalogue)
        stack.delete(journal.number)
        return resolved
      }
    }
    stack.delete(journal.number)
    return journal
  }

  private async catalogue(): Promise<JournalDefinition[]> { return (await this.persistence.listJournalDefinitions()).map(({ number, title, content, dependencies }) => ({ number, title, content, dependencies })) }
  private async catalogueMap(): Promise<Map<number, JournalDefinition>> { return new Map((await this.catalogue()).map(item => [item.number, item])) }
  private validateCatalogue(catalogue: Map<number, JournalDefinition>): void {
    for (const journal of catalogue.values()) {
      for (const dependency of journal.dependencies) if (!catalogue.has(dependency)) throw new BadRequestException(`Journal ${journal.number} : dépendance inexistante ${dependency}.`)
      this.validateCycle(journal.number, new Set(), new Set(), catalogue)
    }
  }
  private validateCycle(number: number, visiting: Set<number>, checked: Set<number>, catalogue: Map<number, JournalDefinition>): void {
    if (checked.has(number)) return
    if (visiting.has(number)) throw new Error(`Catalogue de journaux invalide : dépendance circulaire autour de ${number}.`)
    visiting.add(number)
    for (const dependency of catalogue.get(number)!.dependencies) this.validateCycle(dependency, visiting, checked, catalogue)
    visiting.delete(number); checked.add(number)
  }
  private input(input: unknown): JournalDefinition {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {}
    const number = value.number; const title = typeof value.title === 'string' ? value.title.trim() : ''; const content = typeof value.content === 'string' ? value.content : ''
    const dependencies = Array.isArray(value.dependencies) ? [...new Set(value.dependencies.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item > 0))] : []
    if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) throw new BadRequestException('Numéro de journal invalide.')
    if (!title) throw new BadRequestException('Titre obligatoire.')
    if (dependencies.includes(number)) throw new BadRequestException('Un journal ne peut pas dépendre de lui-même.')
    return { number, title, content, dependencies }
  }
}
