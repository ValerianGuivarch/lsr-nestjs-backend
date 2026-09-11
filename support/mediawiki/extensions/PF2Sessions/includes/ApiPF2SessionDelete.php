<?php

use MediaWiki\MediaWikiServices;

class ApiPF2SessionDelete extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) {
            $this->dieWithError( 'Vous devez être administrateur pour supprimer une séance.' );
        }

        $params = $this->extractRequestParams();
        $base = rtrim( MediaWikiServices::getInstance()->getMainConfig()->get( 'PF2SessionsApiBase' ), '/' );
        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
            $base . '/wiki/sessions/' . rawurlencode( $params['id'] ),
            [ 'method' => 'DELETE', 'timeout' => 15 ],
            __METHOD__
        );
        $status = $request->execute();
        $data = json_decode( $request->getContent(), true );
        if ( !$status->isOK() || !is_array( $data ) ) {
            $this->dieWithError( is_array( $data ) && isset( $data['message'] ) ? $data['message'] : 'Impossible de supprimer la séance.' );
        }
        $this->getResult()->addValue( null, 'pf2', $data );
    }

    public function getAllowedParams() { return [ 'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ] ]; }
    public function needsToken() { return 'csrf'; }
    public function isWriteMode() { return true; }
}
