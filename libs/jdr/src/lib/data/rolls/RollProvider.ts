import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JdrError } from '../../domain/shared/JdrError'
import { DiceRoll } from '../../domain/rolls/DiceRoll'
import { IRollProvider } from '../../domain/rolls/ports/IRollProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { JdrMapper } from '../jdr/JdrMapper'
import { DBJdrDiceRoll } from './database/jdr-dice-roll.db'
import { RollMapper } from './RollMapper'

@Injectable()
export class RollProvider implements IRollProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrDiceRoll, 'jdr-sqlite') private readonly diceRollRepo: Repository<DBJdrDiceRoll>
  ) {}

  async rollDice(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    rollState: DiceRoll['rollState'] = 'normal',
    text?: string | null
  ): Promise<DiceRoll> {
    const domainJdr = await this.loadDomainJdr(jdrSlug)

    const character = domainJdr.characters.find((c) => c.slug === characterSlug)
    if (!character) throw JdrError.notFound(`Character ${characterSlug}`)

    const stat = domainJdr.stats.find((s) => s.slug === statSlug)
    if (!stat) throw JdrError.notFound(`Stat ${statSlug}`)

    const finalStats = domainJdr.computeFinalStats(characterSlug)
    const statValue = Math.max(0, finalStats.get(statSlug) ?? 0)
    const results = Array.from({ length: statValue }, () => Math.floor(Math.random() * 6) + 1)

    const saved = await this.diceRollRepo.save(
      this.diceRollRepo.create({
        jdrSlug,
        characterSlug,
        characterName: character.name,
        statSlug,
        statName: stat.name,
        statValue,
        rollState,
        results,
        text: text ?? null
      })
    )
    return RollMapper.toDomain(saved)
  }

  async rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRoll> {
    const domainJdr = await this.loadDomainJdr(jdrSlug)
    const character = domainJdr.characters.find((c) => c.slug === characterSlug)
    if (!character) throw JdrError.notFound(`Character ${characterSlug}`)

    const match = /^(\d+)d(\d+)$/i.exec(formula.trim())
    if (!match) throw JdrError.badRequest(`Invalid formula: ${formula}. Expected format XdX (e.g. 2d6, 1d20)`)
    const count = Math.min(50, parseInt(match[1], 10))
    const faces = Math.min(1000, parseInt(match[2], 10))
    const results = Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1)

    const saved = await this.diceRollRepo.save(
      this.diceRollRepo.create({
        jdrSlug,
        characterSlug,
        characterName: character.name,
        statSlug: 'arbitrary',
        statName: formula.toLowerCase().trim(),
        statValue: faces,
        rollState: 'normal',
        isArbitrary: true,
        formula: formula.toLowerCase().trim(),
        results
      })
    )
    return RollMapper.toDomain(saved)
  }

  async getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]> {
    const rows = await this.diceRollRepo.find({
      where: { jdrSlug },
      order: { createdDate: 'DESC' },
      take: size
    })
    return rows.map(RollMapper.toDomain)
  }

  async deleteRoll(jdrSlug: string, rollId: string): Promise<void> {
    const result = await this.diceRollRepo.delete({ id: rollId, jdrSlug })
    if (!result.affected) throw JdrError.notFound(`Roll ${rollId}`)
  }

  private async loadDomainJdr(jdrSlug: string) {
    const db = await this.jdrRepo.findOne({
      where: { slug: jdrSlug },
      relations: DBJdr.RELATIONS,
      relationLoadStrategy: 'query'
    })
    if (!db) throw JdrError.notFound(`Jdr ${jdrSlug}`)
    return JdrMapper.toDomain(db)
  }
}
