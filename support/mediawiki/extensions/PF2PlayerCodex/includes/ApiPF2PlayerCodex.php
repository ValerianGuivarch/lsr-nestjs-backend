<?php
use MediaWiki\MediaWikiServices;
class ApiPF2PlayerCodex extends ApiBase {
    public function execute() {
        $services = MediaWikiServices::getInstance();
        $base = rtrim( $services->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $user = $this->getUser();
        $canAdmin = $user->isRegistered() && $user->isAllowed( 'delete' );
        $canEditDescription = $user->isRegistered() && $user->isAllowed( 'edit' );
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
        $factionRequest = $services->getHttpRequestFactory()->create( $base . '/player-codex/factions', [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ );
        $factionStatus = $factionRequest->execute(); $factions = json_decode( $factionRequest->getContent(), true );
        if ( !$factionStatus->isOK() || !is_array( $factions ) ) { $this->dieWithError( 'Impossible de charger les factions joueur PF2.' ); }
        $this->getResult()->addValue( null, 'pf2playercodex', [ 'characters' => $characters, 'factions' => $factions, 'canEdit' => $canAdmin ? 1 : 0, 'canEditDescription' => $canEditDescription ? 1 : 0 ] );
    }
    public function isReadMode() { return true; }
}
