import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

@Controller('health')
export class HealthController {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  @Get()
  async health(): Promise<{ status: 'ok'; sqlite: true }> {
    try {
      await this.persistence.health()
      return { status: 'ok', sqlite: true }
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', sqlite: false })
    }
  }
}
