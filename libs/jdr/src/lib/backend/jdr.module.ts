import { Module } from '@nestjs/common'
import { JdrService } from './application/jdr.service'
import { JdrImplementation } from './infrastructure/jdr.implementation'
import { JdrController } from './infrastructure/http/jdr.controller'
import { JdrSqliteModule } from './infrastructure/persistence/database/jdr-sqlite.module'

@Module({
  imports: [JdrSqliteModule],
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
