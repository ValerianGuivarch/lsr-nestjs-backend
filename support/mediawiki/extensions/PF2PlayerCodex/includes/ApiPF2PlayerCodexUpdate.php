<?php
use MediaWiki\MediaWikiServices;
class ApiPF2PlayerCodexUpdate extends ApiBase {
    public function execute() {
        $user = $this->getUser(); if ( !$user->isRegistered() || !$user->isAllowed( 'edit' ) ) { $this->dieWithError( 'Vous devez pouvoir modifier le wiki.' ); }
        $params = $this->extractRequestParams(); $payload = json_decode( $params['payload'], true ); if ( !is_array( $payload ) ) { $this->dieWithError( 'Données invalides.' ); }
        $base = rtrim( MediaWikiServices::getInstance()->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $op = $params['op']; $routes = [ 'createFaction' => [ 'POST', '/player-codex/factions' ], 'updateFaction' => [ 'PATCH', '/player-codex/factions/' . rawurlencode( $params['id'] ) ], 'addFaction' => [ 'POST', '/player-codex/characters/' . rawurlencode( $params['id'] ) . '/factions' ], 'removeFaction' => [ 'DELETE', '/player-codex/characters/' . rawurlencode( $params['id'] ) . '/factions/' . rawurlencode( $params['target'] ) ] ];
        if ( !isset( $routes[$op] ) ) { $this->dieWithError( 'Opération inconnue.' ); }
        [ $method, $path ] = $routes[$op]; $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create( $base . $path, [ 'method' => $method, 'timeout' => 15, 'postData' => json_encode( $payload ), 'headers' => [ 'Content-Type' => 'application/json' ] ], __METHOD__ );
        $status = $request->execute(); $data = json_decode( $request->getContent(), true ); if ( !$status->isOK() || !is_array( $data ) ) { $this->dieWithError( is_array( $data ) && isset( $data['message'] ) ? $data['message'] : 'Mise à jour du carnet impossible.' ); }
        $this->getResult()->addValue( null, 'pf2', $data );
    }
    public function getAllowedParams() { return [ 'op' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ], 'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DEFAULT => '' ], 'target' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DEFAULT => '' ], 'payload' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ] ]; }
    public function needsToken() { return 'csrf'; } public function isWriteMode() { return true; }
}
