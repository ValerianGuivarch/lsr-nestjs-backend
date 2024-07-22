import { DBSession } from './DBSession'
import { Session } from '../../../domain/models/session/Session'
import { ISessionProvider } from '../../../domain/providers/ISessionProvider'
import { InjectRepository } from '@nestjs/typeorm'
import { Entity, Repository } from 'typeorm'

@Entity()
export class DBSessionProvider implements ISessionProvider {
  constructor(
    @InjectRepository(DBSession, 'postgres')
    private dbSessionRepository: Repository<DBSession>
  ) {}

  private static toSession(doc: DBSession): Session {
    return new Session({
      chaos: doc.chaos,
      baseRest: doc.baseRest,
      improvedRest: doc.improvedRest,
      owners: doc.owners,
      fake: doc.fake,
      entries: doc.entries ?? '',
      speaking: doc.speaking ?? ''
    })
  }

  async getSession(): Promise<Session> {
    // get all
    const session = await this.dbSessionRepository.find({})
    if (session && session.length > 0) return DBSessionProvider.toSession(session[0])
    else {
      // create one
      return DBSessionProvider.toSession(await this.dbSessionRepository.create({}))
    }
  }

  async updateSpeaking(speaking: string): Promise<void> {
    const session = (await this.dbSessionRepository.find({}))[0]
    session.speaking = speaking
    await this.dbSessionRepository.save(session)
  }
}
