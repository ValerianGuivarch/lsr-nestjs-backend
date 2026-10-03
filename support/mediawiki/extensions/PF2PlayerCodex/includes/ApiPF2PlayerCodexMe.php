<?php

use MediaWiki\MediaWikiServices;

class ApiPF2PlayerCodexMe extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() ) {
            $this->getResult()->addValue( null, 'pf2playercodexme', [
                'registered' => 0,
                'wikiUsername' => '',
                'characters' => [],
            ] );
            return;
        }

        $services = MediaWikiServices::getInstance();
        $config = $services->getMainConfig();
        $base = rtrim( (string)$config->get( 'PF2PlayerCodexApiBase' ), '/' );
        $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
        if ( $base === '' || $key === '' ) {
            $this->dieWithError( 'L’espace personnel PF2 n’est pas configuré.' );
        }

        $url = $base . '/player-codex/me?wikiUsername=' . rawurlencode( $user->getName() );
        $request = $services->getHttpRequestFactory()->create(
            $url,
            [ 'method' => 'GET', 'timeout' => 10 ],
            __METHOD__
        );
        $request->setHeader( 'X-PF2-Wiki-Key', $key );
        $status = $request->execute();
        $payload = json_decode( $request->getContent(), true );
        if ( !$status->isOK() || !is_array( $payload ) ) {
            $this->dieWithError( 'Impossible de charger vos personnages PF2.' );
        }

        $this->getResult()->addValue( null, 'pf2playercodexme', [
            'registered' => 1,
            'wikiUsername' => $user->getName(),
            'characters' => is_array( $payload['characters'] ?? null ) ? $payload['characters'] : [],
        ] );
    }

    public function isReadMode() { return true; }
}
