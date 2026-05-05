import { Module } from '@nestjs/common'
import { JdrService } from './application/jdr.service'
import { JdrImplementation } from './infrastructure/jdr.implementation'
import { JdrController } from './infrastructure/http/jdr.controller'
import { JdrPostgresModule } from './infrastructure/persistence/database/jdr-postgres.module'

@Module({
  imports: [JdrPostgresModule],
  controllers: [JdrController],
  providers: [
    JdrService,
    {
      provide: 'IJdrProvider',
      useClass: JdrImplementation
    }
  ]
})
export class JdrModule {}
