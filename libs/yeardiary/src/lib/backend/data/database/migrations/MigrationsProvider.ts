import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@Injectable()
export class MigrationsProvider {
  constructor(@InjectDataSource() private readonly datasource: DataSource) {}

  async runMigrations(): Promise<void> {
    await this.datasource.runMigrations()
  }
}
