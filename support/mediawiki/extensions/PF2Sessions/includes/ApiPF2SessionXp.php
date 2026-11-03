<?php

use MediaWiki\MediaWikiServices;

/**
 * Admin-only MediaWiki proxy. Never expose the internal PF2 key to JavaScript.
 * The backend also requires this key on the corresponding endpoint.
 */
class ApiPF2SessionXp extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'pf2sessions-admin' ) ) {
            $this->dieWithError( 'Outil XP réservé aux administrateurs du wiki.' );
        }

        $params = $this->extractRequestParams();
        $sessionId = trim( (string)$params['id'] );
        if ( !preg_match( '/^[a-f0-9-]{36}$/i', $sessionId ) ) {
            $this->dieWithError( 'Identifiant de séance invalide.' );
        }

        $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';
        if ( $key === '' ) {
            $this->dieWithError( 'Clé interne PF2 indisponible.' );
        }

        $services = MediaWikiServices::getInstance();
        $config = $services->getMainConfig();
        $base = rtrim( (string)$config->get( 'PF2SessionsApiBase' ), '/' );
        $request = $services->getHttpRequestFactory()->create(
            $base . '/wiki/sessions/' . rawurlencode( $sessionId ) . '/xp-aid',
            [ 'method' => 'GET', 'timeout' => 12 ],
            __METHOD__
        );
        $request->setHeader( 'X-PF2-Wiki-Key', $key );
        $status = $request->execute();
        if ( !$status->isOK() ) {
            $this->dieWithError( 'Impossible de calculer l’XP de cette séance.' );
        }

        $payload = json_decode( $request->getContent(), true );
        if ( !is_array( $payload ) || !isset( $payload['sessionId'] ) ||
            $payload['sessionId'] !== $sessionId ) {
            $this->dieWithError( 'Réponse XP invalide.' );
        }

        $this->getResult()->addValue( null, 'pf2sessionxp', $payload );
    }

    public function getAllowedParams() {
        return [
            'id' => [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],
        ];
    }

    public function isReadMode() {
        return true;
    }
}
