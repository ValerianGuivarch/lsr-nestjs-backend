import { DBEntry } from '../../data/database/entries/DBEntry'
import { ISessionProvider } from '../../domain/providers/ISessionProvider'
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitEntry {
  constructor(
    @InjectRepository(DBEntry, 'postgres')
    private dbEntryRepository: Repository<DBEntry>,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider
  ) {}

  async getEntriesText(): Promise<string> {
    return (await this.sessionProvider.getSession()).entries.toString()
  }

  async initEntry(): Promise<void> {
    let currentYear = ''
    let currentMonth = ''
    const monthNames = {
      JANVIER: '01',
      FEVRIER: '02',
      MARS: '03',
      AVRIL: '04',
      MAI: '05',
      JUIN: '06',
      JUILLET: '07',
      AOUT: '08',
      SEPTEMBRE: '09',
      OCTOBRE: '10',
      NOVEMBRE: '11',
      DECEMBRE: '12'
    }

    const text = await this.getEntriesText()
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.match(/^\d{4}$/)) {
        currentYear = line
      } else if (monthNames[line.toUpperCase()]) {
        currentMonth = monthNames[line.toUpperCase()]
      } else {
        const dayMatch = line.match(/^(\d+)\s*:\s*(.*)/)
        if (dayMatch) {
          // eslint-disable-next-line no-magic-numbers
          const day = dayMatch[1].padStart(2, '0')
          // eslint-disable-next-line no-magic-numbers
          const entryText = dayMatch[2]
          //console.log(`${day}/${currentMonth}/${currentYear}: ${entryText}`)
          const entry = this.dbEntryRepository.create({
            text: entryText,
            day: parseInt(day),
            month: parseInt(currentMonth),
            year: parseInt(currentYear)
          })
          await this.dbEntryRepository.save(entry)
        }
      }
    }
  }
}
