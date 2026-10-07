import { Module } from '@nestjs/common'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'
import { ScenarioPackageService } from './ScenarioPackageService'
import { ScenarioPreparationService } from './ScenarioPreparationService'
import { FoundryReferenceLibraryService } from './FoundryReferenceLibraryService'
import { GeneratedDownloadService } from './GeneratedDownloadService'
import { ScenarioCampaignService } from './ScenarioCampaignService'
import { PlayerCodexService } from './PlayerCodexService'
import { PlayerCodexController } from './PlayerCodexController'
import { MediaWikiClientService } from './MediaWikiClientService'
import { Pf2WikiLoginController } from './Pf2WikiLoginController'
import { Pf2ResourceService } from './Pf2ResourceService'
import { Pf2ResourceController } from './Pf2ResourceController'

@Module({ imports: [Pf2PersistenceModule, FoundryRelayModule], controllers: [Pf2MjController, PlayerCodexController, Pf2WikiLoginController, Pf2ResourceController], providers: [Pf2MjService, ScenarioPackageService, ScenarioPreparationService, ScenarioCampaignService, FoundryReferenceLibraryService, GeneratedDownloadService, PlayerCodexService, MediaWikiClientService, Pf2ResourceService], exports: [PlayerCodexService, MediaWikiClientService] })
export class Pf2MjModule {}
