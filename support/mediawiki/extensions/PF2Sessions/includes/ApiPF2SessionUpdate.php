<?php

use MediaWiki\MediaWikiServices;

class ApiPF2SessionUpdate extends ApiBase {
    public function execute() {
        $this->requireEditor();
        $params = $this->extractRequestParams();
        $payload = json_decode( $params['payload'], true );
        if ( !is_array( $payload ) ) {
            $this->dieWithError( 'Données de séance invalides.' );
        }

        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $url = $base . '/wiki/sessions/' . rawurlencode( $params['id'] );

        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
            $url,
            [
                'method' => 'PATCH',
                'timeout' => 15,
                'postData' => json_encode( $payload ),
                'headers' => [ 'Content-Type' => 'application/json' ],
            ],
            __METHOD__
        );
        $status = $request->execute();
        $data = json_decode( $request->getContent(), true );
        if ( !$status->isOK() ) {
            $message = is_array( $data ) && isset( $data['message'] ) ? $data['message'] : 'Impossible d’enregistrer la séance.';
            $this->dieWithError( $message );
        }
        if ( !is_array( $data ) ) {
            $this->dieWithError( 'Réponse PF2 invalide.' );
        }

        $this->getResult()->addValue( null, 'pf2', $data );
    }

    private function requireEditor(): void {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'edit' ) ) {
            $this->dieWithError( 'Vous devez être connecté et autorisé à modifier le wiki.' );
        }
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
