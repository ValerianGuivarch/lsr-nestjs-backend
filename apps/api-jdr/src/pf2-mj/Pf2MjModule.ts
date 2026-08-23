import { Module } from '@nestjs/common'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

@Module({ controllers: [Pf2MjController], providers: [Pf2MjService] })
export class Pf2MjModule {}
