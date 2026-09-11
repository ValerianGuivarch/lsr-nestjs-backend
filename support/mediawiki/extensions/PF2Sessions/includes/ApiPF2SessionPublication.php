<?php

use MediaWiki\MediaWikiServices;

class ApiPF2SessionPublication extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) {
            $this->dieWithError( 'Vous devez être administrateur pour modifier la publication.' );
        }

        $params = $this->extractRequestParams();
        if ( $params['published'] !== '0' && $params['published'] !== '1' ) {
            $this->dieWithError( 'État de publication invalide.' );
        }

        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $url = $base . '/wiki/sessions/' . rawurlencode( $params['id'] ) . '/publication';

        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
            $url,
            [
                'method' => 'POST',
                'timeout' => 15,
                'postData' => json_encode( [ 'published' => $params['published'] === '1' ] ),
                'headers' => [ 'Content-Type' => 'application/json' ],
            ],
            __METHOD__
        );
        $status = $request->execute();
        $data = json_decode( $request->getContent(), true );
        if ( !$status->isOK() ) {
            $message = is_array( $data ) && isset( $data['message'] ) ? $data['message'] : 'Impossible de modifier la publication.';
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
