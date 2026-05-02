import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBDiary } from './diaries/DBDiary';
import { InitDb1634567890123 } from './migrations/1718445801-init-db';
import { MigrationsProvider } from './migrations/MigrationsProvider';
import { DBDiaryProvider } from './diaries/DBDiaryProvider';
import config from '../../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DBDiary,
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'sqlite',
        database: config().sqlite.database,
        autoLoadEntities: config().sqlite.autoLoadEntities,
        synchronize: false,
        entities: [
          DBDiary,
        ],
        migrations: [
          InitDb1634567890123,
        ]
      }),
      inject: [ConfigService]
    })
  ],
  providers: [
    MigrationsProvider,
    {
      provide: 'IDiaryProvider',
      useClass: DBDiaryProvider
    }
  ],
  exports: [
    TypeOrmModule,
    {
      provide: 'IDiaryProvider',
      useClass: DBDiaryProvider
    },
  ]
})
export class SQLiteModule {}
