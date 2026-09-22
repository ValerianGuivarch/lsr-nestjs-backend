import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { JOURNAL_CATALOGUE, JournalDefinition } from './JournalCatalogue'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

export type JournalListItem = { number: number; title: string; revealed: boolean }
export type JournalView = JournalListItem & { content?: string; revealedAt?: string | null; revealedBy?: string | null }

@Injectable()
export class Pf2JournalsService {
  private readonly catalogue = new Map<number, JournalDefinition>()

  constructor(private readonly persistence: Pf2PersistenceService) {
    for (const journal of JOURNAL_CATALOGUE) {
      if (!Number.isInteger(journal.number) || journal.number < 1 || this.catalogue.has(journal.number)) throw new Error(`Catalogue de journaux invalide : numéro ${journal.number}.`)
      this.catalogue.set(journal.number, { ...journal, dependencies: [...journal.dependencies] })
    }
    this.validateCatalogue()
  }

  async list(): Promise<JournalListItem[]> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    return [...this.catalogue.values()].sort((a, b) => a.number - b.number).map(item => ({ number: item.number, title: item.title, revealed: revealed.has(item.number) }))
  }

  async view(number: number, canReadUnrevealed = false): Promise<JournalView> {
    const journal = this.definition(number)
    const state = (await this.persistence.listJournalRevelations()).find(item => item.journalNumber === number) ?? null
    const revealed = Boolean(state)
    const result: JournalView = { number: journal.number, title: journal.title, revealed, revealedAt: state?.revealedAt ?? null, revealedBy: canReadUnrevealed ? state?.revealedBy ?? null : null }
    if (revealed || canReadUnrevealed) result.content = journal.content
    return result
  }

  async resolveJournalToReveal(targetNumber: number): Promise<JournalDefinition | null> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    return this.resolve(this.definition(targetNumber), revealed, new Set())
  }

  async randomJournalToReveal(): Promise<JournalDefinition | null> {
    const revealed = new Set((await this.persistence.listJournalRevelations()).map(item => item.journalNumber))
    const candidates = [...this.catalogue.values()].filter(item => !revealed.has(item.number))
    if (!candidates.length) return null
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    return this.resolve(chosen, revealed, new Set())
  }

  async claim(number: number, discordUserId: string): Promise<'claimed' | 'revealed' | 'busy'> {
    this.definition(number)
    return this.persistence.claimJournalReveal(number, discordUserId)
  }
  async complete(number: number, discordUserId: string, discordMessageId: string): Promise<boolean> { return this.persistence.completeJournalReveal(number, discordUserId, discordMessageId) }
  async abandon(number: number, discordUserId: string): Promise<void> { await this.persistence.abandonJournalReveal(number, discordUserId) }

  definition(number: number): JournalDefinition {
    if (!Number.isInteger(number) || number < 1) throw new BadRequestException('Numéro de journal invalide.')
    const journal = this.catalogue.get(number)
    if (!journal) throw new NotFoundException(`Journal ${number} introuvable.`)
    return journal
  }

  private resolve(journal: JournalDefinition, revealed: Set<number>, stack: Set<number>): JournalDefinition | null {
    if (revealed.has(journal.number)) return null
    if (stack.has(journal.number)) throw new BadRequestException(`Dépendance circulaire détectée pour le journal ${journal.number}.`)
    stack.add(journal.number)
    for (const dependency of journal.dependencies) {
      const prerequisite = this.catalogue.get(dependency)
      if (!prerequisite) throw new BadRequestException(`Le journal ${journal.number} dépend du journal inexistant ${dependency}.`)
      if (!revealed.has(dependency)) {
        const resolved = this.resolve(prerequisite, revealed, stack)
        stack.delete(journal.number)
        return resolved
      }
    }
    stack.delete(journal.number)
    return journal
  }

  private validateCatalogue(): void {
    for (const journal of this.catalogue.values()) {
      for (const dependency of journal.dependencies) if (!this.catalogue.has(dependency)) throw new Error(`Journal ${journal.number} : dépendance inexistante ${dependency}.`)
      this.validateCycle(journal.number, new Set(), new Set())
    }
  }
  private validateCycle(number: number, visiting: Set<number>, checked: Set<number>): void {
    if (checked.has(number)) return
    if (visiting.has(number)) throw new Error(`Catalogue de journaux invalide : dépendance circulaire autour de ${number}.`)
    visiting.add(number)
    for (const dependency of this.definition(number).dependencies) this.validateCycle(dependency, visiting, checked)
    visiting.delete(number); checked.add(number)
  }
}
