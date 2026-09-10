<?php
use MediaWiki\MediaWikiServices;
class ApiPF2PlayerCodex extends ApiBase {
    public function execute() {
        $base = rtrim( MediaWikiServices::getInstance()->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create( $base . '/player-codex/characters', [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ ); $status = $request->execute();
        if ( !$status->isOK() ) { $this->dieWithError( 'Impossible de charger le carnet joueur PF2.' ); }
        $characters = json_decode( $request->getContent(), true );
        if ( !is_array( $characters ) ) { $this->dieWithError( 'Réponse PF2 invalide.' ); }
        $factionRequest = MediaWikiServices::getInstance()->getHttpRequestFactory()->create( $base . '/player-codex/factions', [ 'method' => 'GET', 'timeout' => 10 ], __METHOD__ );
        $factionStatus = $factionRequest->execute(); $factions = json_decode( $factionRequest->getContent(), true );
        if ( !$factionStatus->isOK() || !is_array( $factions ) ) { $this->dieWithError( 'Impossible de charger les factions joueur PF2.' ); }
        $this->getResult()->addValue( null, 'pf2playercodex', [ 'characters' => $characters, 'factions' => $factions, 'canEdit' => $this->getUser()->isRegistered() && $this->getUser()->isAllowed( 'edit' ) ? 1 : 0 ] );
    }
    public function isReadMode() { return true; }
}
