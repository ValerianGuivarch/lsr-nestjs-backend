import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GhostModule } from './ghost.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'ghost.sqlite',
      entities: [__dirname + '/**/*.entity.{ts,js}'],
      synchronize: true,
    }),
    GhostModule
  ],
})
export class AppGhostModule {}
