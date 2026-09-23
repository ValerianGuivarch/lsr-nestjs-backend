import { Logger, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { dirname, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { Pf2PersistenceService } from './Pf2PersistenceService'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'pf2-sqlite',
      useFactory: async () => {
        const database = resolve(process.env['SQLITE_PATH'] ?? 'pf2.sqlite')
        await mkdir(dirname(database), { recursive: true })
        Logger.log(`Base SQLite PF2 utilisée : ${database}`, Pf2PersistenceModule.name)
        return { name: 'pf2-sqlite', type: 'sqlite' as const, database, synchronize: false }
      }
    })
  ],
  providers: [Pf2PersistenceService],
  exports: [Pf2PersistenceService]
})
export class Pf2PersistenceModule {}
