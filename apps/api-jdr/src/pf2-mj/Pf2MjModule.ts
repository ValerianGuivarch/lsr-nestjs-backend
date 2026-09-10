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

@Module({ imports: [Pf2PersistenceModule, FoundryRelayModule], controllers: [Pf2MjController, PlayerCodexController], providers: [Pf2MjService, ScenarioPackageService, ScenarioPreparationService, ScenarioCampaignService, FoundryReferenceLibraryService, GeneratedDownloadService, PlayerCodexService, MediaWikiClientService], exports: [PlayerCodexService, MediaWikiClientService] })
export class Pf2MjModule {}
