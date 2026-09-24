<?php

use MediaWiki\MediaWikiServices;

class ApiPF2SessionPublication extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() ) {
            $this->dieWithError( 'Vous devez être connecté pour modifier la publication.' );
        }

        $params = $this->extractRequestParams();
        if ( $params['published'] !== '0' && $params['published'] !== '1' ) {
            $this->dieWithError( 'État de publication invalide.' );
        }

        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $url = $base . '/wiki/sessions/' . rawurlencode( $params['id'] ) . '/publication';

        try {
            $client = MediaWikiServices::getInstance()
                ->getHttpRequestFactory()
                ->createGuzzleClient();
            $response = $client->request(
                'POST',
                $url,
                [
                    'timeout' => 15,
                    'http_errors' => false,
                    'headers' => [ 'Accept' => 'application/json' ],
                    'json' => [ 'published' => $params['published'] === '1' ],
                ]
            );
        } catch ( Throwable $error ) {
            $this->dieWithError( 'Impossible de joindre l’API PF2.' );
        }

        $status = $response->getStatusCode();
        $data = json_decode( (string)$response->getBody(), true );
        if ( $status < 200 || $status >= 300 ) {
            $message = is_array( $data ) && isset( $data['message'] )
                ? $data['message']
                : 'Impossible de modifier la publication.';
            $this->dieWithError( $message );
        }
        if ( !is_array( $data ) ) {
            $this->dieWithError( 'Réponse PF2 invalide.' );
        }

        $this->getResult()->addValue( null, 'pf2', $data );
    }

    public function getAllowedParams() {
        return [
            'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
            'published' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
        ];
    }

    public function needsToken() {
        return 'csrf';
    }

    public function isWriteMode() {
        return true;
    }
}
