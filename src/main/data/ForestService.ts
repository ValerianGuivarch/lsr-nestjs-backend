import { customizeCollectionDbCompany } from './customizeCollectionDbCharacter'
import { forestAdminElena } from './forestAdminElena'
import { CharacterService } from '../domain/services/CharacterService'
import { ConstellationService } from '../domain/services/entities/elena/ConstellationService'
import { JoueuseService } from '../domain/services/entities/elena/JoueuseService'
import { MessageService } from '../domain/services/entities/elena/MessageService'
import { ScenarioService } from '../domain/services/entities/elena/ScenarioService'
import { Agent, createAgent } from '@forestadmin/agent'
import { createSqlDataSource } from '@forestadmin/datasource-sql'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ForestService {
  static agent: Agent

  constructor(
    characterService: CharacterService,
    scenarioService: ScenarioService,
    constellationsService: ConstellationService,
    joueuseService: JoueuseService,
    messageService: MessageService
  ) {
    ForestService.agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET,
      envSecret: process.env.FOREST_ENV_SECRET,
      isProduction: process.env.NODE_ENV === 'production',
      typingsPath: './typings.ts',
      typingsMaxDepth: 5
    }).addDataSource(createSqlDataSource(process.env.DB_URI))

    customizeCollectionDbCompany({ agent: ForestService.agent, characterService })
    forestAdminElena({
      agent: ForestService.agent,
      scenarioService,
      constellationsService,
      joueuseService,
      messageService
    })
  }
}
