import { customizeCollectionDbCompany } from './customizeCollectionDbCharacter'
import { CharacterService } from '../domain/services/CharacterService'
import { Agent, createAgent } from '@forestadmin/agent'
import { createSqlDataSource } from '@forestadmin/datasource-sql'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ForestService {
  static agent: Agent

  constructor(characterService: CharacterService) {
    ForestService.agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET,
      envSecret: process.env.FOREST_ENV_SECRET,
      isProduction: process.env.NODE_ENV === 'production',
      typingsPath: './typings.ts',
      typingsMaxDepth: 5
    }).addDataSource(createSqlDataSource(process.env.DB_URI))

    customizeCollectionDbCompany({ agent: ForestService.agent, characterService })
  }
}
