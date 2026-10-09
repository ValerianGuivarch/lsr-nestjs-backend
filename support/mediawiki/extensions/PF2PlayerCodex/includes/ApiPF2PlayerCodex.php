<?php
use MediaWiki\MediaWikiServices;
class ApiPF2PlayerCodex extends ApiBase {
    public function execute() {
        $services = MediaWikiServices::getInstance();
        $base = rtrim( $services->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $user = $this->getUser();
        $canAdmin = $user->isRegistered() && $user->isAllowed( 'delete' );
        $canEditDescription = $user->isRegistered() && $user->isAllowed( 'edit' );
        $canEditFactions = $canEditDescription;
        $path = $canAdmin ? '/player-codex/internal/characters' : '/player-codex/characters';
        $request = $services->getHttpRequestFactory()->create( $base . $path, [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ );
        if ( $canAdmin ) {
            $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
            $request->setHeader( 'X-PF2-Wiki-Key', $key );
        }
        $status = $request->execute();
        if ( !$status->isOK() ) { $this->dieWithError( 'Impossible de charger le carnet joueur PF2.' ); }
        $characters = json_decode( $request->getContent(), true );
        if ( !is_array( $characters ) ) { $this->dieWithError( 'Réponse PF2 invalide.' ); }
        $factionPath = $canAdmin ? '/player-codex/internal/factions' : '/player-codex/factions';
        $factionRequest = $services->getHttpRequestFactory()->create( $base . $factionPath, [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ );
        if ( $canAdmin ) {
            $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
            $factionRequest->setHeader( 'X-PF2-Wiki-Key', $key );
        }
        $factionStatus = $factionRequest->execute(); $factions = json_decode( $factionRequest->getContent(), true );
        if ( !$factionStatus->isOK() || !is_array( $factions ) ) { $this->dieWithError( 'Impossible de charger les factions joueur PF2.' ); }

        $mjFactions = [];
        if ( $canAdmin ) {
            $mjRequest = $services->getHttpRequestFactory()->create( $base . '/player-codex/internal/mj-factions', [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ );
            $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
            $mjRequest->setHeader( 'X-PF2-Wiki-Key', $key );
            $mjStatus = $mjRequest->execute(); $mjFactions = json_decode( $mjRequest->getContent(), true );
            if ( !$mjStatus->isOK() || !is_array( $mjFactions ) ) { $this->dieWithError( 'Impossible de charger les associations de factions MJ.' ); }
        }
        $this->getResult()->addValue( null, 'pf2playercodex', [ 'characters' => $characters, 'factions' => $factions, 'mjFactions' => $mjFactions, 'canEdit' => $canAdmin ? 1 : 0, 'canEditDescription' => $canEditDescription ? 1 : 0, 'canEditFactions' => $canEditFactions ? 1 : 0, 'canManageFactionLinks' => $canAdmin ? 1 : 0 ] );
    }
    public function isReadMode() { return true; }
}
