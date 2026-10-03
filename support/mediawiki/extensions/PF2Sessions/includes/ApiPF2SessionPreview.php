<?php

use MediaWiki\MediaWikiServices;

class ApiPF2SessionPreview extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() ) {
            $this->dieWithError( 'Vous devez être connecté pour modifier les séances.' );
        }

        $params = $this->extractRequestParams();
        $payload = json_decode( $params['payload'], true );
        if ( !is_array( $payload ) ) {
            $this->dieWithError( 'Données de séance invalides.' );
        }

        $allowed = array_flip( [
            'sessionNumber',
            'date',
            'inGameStartDate',
            'inGameEndDate',
            'title',
            'participants',
            'longSummaryAuthor',
            'shortSummaryAuthor',
            'sessionXp',
            'shortSummary',
        ] );
        $payload = array_intersect_key( $payload, $allowed );

        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $url = $base . '/wiki/sessions/' . rawurlencode( $params['id'] ) . '/preview';

        try {
            $client = MediaWikiServices::getInstance()->getHttpRequestFactory()->createGuzzleClient();
            $response = $client->request( 'POST', $url, [
                'timeout' => 15,
                'http_errors' => false,
                'headers' => [ 'Accept' => 'application/json' ],
                'json' => $payload,
            ] );
        } catch ( Throwable $error ) {
            $this->dieWithError( 'Impossible de joindre l’API PF2.' );
        }

        $status = $response->getStatusCode();
        $data = json_decode( (string)$response->getBody(), true );
        if ( $status < 200 || $status >= 300 || !is_array( $data ) ) {
            $message = is_array( $data ) && isset( $data['message'] )
                ? $data['message']
                : 'Impossible de calculer le rendu Discord.';
            $this->dieWithError( $message );
        }

        $this->getResult()->addValue( null, 'pf2preview', $data );
    }

    public function getAllowedParams() {
        return [
            'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
            'payload' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
        ];
    }

    public function needsToken() {
        return 'csrf';
    }

    public function isWriteMode() {
        return true;
    }
}
