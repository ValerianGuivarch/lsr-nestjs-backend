<?php

use MediaWiki\MediaWikiServices;

class ApiPF2PlayerCodexMj extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) {
            $this->dieWithError( 'Accès réservé aux administrateurs MJ.' );
        }
        $params = $this->extractRequestParams();
        $services = MediaWikiServices::getInstance();
        $base = rtrim( (string)$services->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
        if ( !$base || !$key ) $this->dieWithError( 'Service MJ non configuré.' );
        $url = $base . '/player-codex/internal/mj-character/' . rawurlencode( $params['npcId'] );
        $request = $services->getHttpRequestFactory()->create( $url, [
            'method' => 'GET', 'timeout' => 10,
        ], __METHOD__ );
        $request->setHeader( 'X-PF2-Wiki-Key', $key );
        $status = $request->execute();
        $payload = json_decode( $request->getContent(), true );
        if ( !$status->isOK() || !is_array( $payload ) || !isset( $payload['markdown'] ) ) {
            $this->dieWithError( 'Fiche MJ introuvable ou indisponible.' );
        }
        $this->getResult()->addValue( null, 'pf2playercodexmj', [
            'npcId' => $params['npcId'],
            'markdown' => $payload['markdown'],
        ] );
    }

    public function getAllowedParams() {
        return [ 'npcId' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ] ];
    }
    public function isReadMode() { return true; }
}
