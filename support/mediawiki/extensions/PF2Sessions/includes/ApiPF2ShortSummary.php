<?php

use MediaWiki\MediaWikiServices;

class ApiPF2ShortSummary extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) {
            $this->dieWithError( 'Vous devez être administrateur pour modifier le résumé court.' );
        }

        $params = $this->extractRequestParams();
        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $id = rawurlencode( $params['id'] );
        $url = $base . '/wiki/sessions/' . $id . '/short-summary';

        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
            $url,
            [
                'method' => 'PATCH',
                'timeout' => 10,
                'postData' => json_encode( [ 'shortSummary' => $params['shortSummary'] ] ),
                'headers' => [ 'Content-Type' => 'application/json' ],
            ],
            __METHOD__
        );
        $status = $request->execute();
        if ( !$status->isOK() ) {
            $this->dieWithError( 'Impossible d’enregistrer le résumé court.' );
        }

        $data = json_decode( $request->getContent(), true );
        if ( !is_array( $data ) ) {
            $this->dieWithError( 'Réponse PF2 invalide.' );
        }

        $this->getResult()->addValue( null, 'pf2', $data );
    }

    public function getAllowedParams() {
        return [
            'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
            'shortSummary' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
        ];
    }

    public function needsToken() {
        return 'csrf';
    }

    public function isWriteMode() {
        return true;
    }
}
