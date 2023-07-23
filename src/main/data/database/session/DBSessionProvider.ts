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
      relanceMj: doc.relanceMj,
      chaos: doc.chaos
    })
  }

  private static fromSession(doc: Session): DBSession {
    return {
      relanceMj: doc.relanceMj,
      chaos: doc.chaos
    } as DBSession
  }

  async getSessionCharacter(): Promise<Session> {
    // get all
    const session = await this.dbSessionRepository.findOne({})
    if (session) return DBSessionProvider.toSession(session)
    else {
      // create one
      await this.dbSessionRepository.create(
        DBSessionProvider.fromSession(
          new Session({
            relanceMj: 0,
            chaos: 0
          })
        )
      )
      return await this.dbSessionRepository.findOne({})
    }
  }
}
