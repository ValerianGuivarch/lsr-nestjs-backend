<?php

use MediaWiki\MediaWikiServices;

class ApiPF2PlayerCodexMeUpdate extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() ) {
            $this->dieWithError( 'Vous devez être connecté pour modifier votre personnage.' );
        }

        $params = $this->extractRequestParams();
        $services = MediaWikiServices::getInstance();
        $config = $services->getMainConfig();
        $base = rtrim( (string)$config->get( 'PF2PlayerCodexApiBase' ), '/' );
        $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
        if ( $base === '' || $key === '' ) {
            $this->dieWithError( 'L’espace personnel PF2 n’est pas configuré.' );
        }

        $body = json_encode( [
            'wikiUsername' => $user->getName(),
            'npcId' => $params['npcId'],
            'content' => $params['content'],
            'field' => $params['field'],
            'value' => $params['content'],
            'wikiIsAdmin' => $user->isAllowed( 'delete' ),
        ] );
        $request = $services->getHttpRequestFactory()->create(
            $base . '/player-codex/me/' . ( $params['field'] === 'shortDescription' ? 'short-description' : ( $params['field'] === 'notes' ? 'notes' : ( $params['field'] === 'name' || $params['field'] === 'ancestry' || $params['field'] === 'characterClass' || ( $params['field'] === 'objective' || $params['field'] === 'personality' ) ? 'sheet' : 'background' ) ) ),
            [
                'method' => 'POST',
                'timeout' => 15,
                'postData' => $body,
            ],
            __METHOD__
        );
        $request->setHeader( 'Content-Type', 'application/json' );
        $request->setHeader( 'X-PF2-Wiki-Key', $key );
        $status = $request->execute();
        $payload = json_decode( $request->getContent(), true );
        if ( !$status->isOK() || !is_array( $payload ) ) {
            $message = is_array( $payload ) && isset( $payload['message'] ) ? $payload['message'] : 'Enregistrement impossible.';
            $this->dieWithError( $message );
        }

        $this->getResult()->addValue( null, 'pf2playercodexmeupdate', $payload );
    }

    public function getAllowedParams() {
        return [
            'npcId' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
            'content' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DFLT => '' ],
            'field' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DFLT => 'background' ],
        ];
    }

    public function needsToken() { return 'csrf'; }
    public function isWriteMode() { return true; }
}
