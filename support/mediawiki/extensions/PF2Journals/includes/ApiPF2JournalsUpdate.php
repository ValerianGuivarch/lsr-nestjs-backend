<?php
use MediaWiki\MediaWikiServices;
class ApiPF2JournalsUpdate extends ApiBase {
    public function execute() {
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) { $this->dieWithError( 'Vous devez être administrateur pour modifier les journaux.' ); }
        $params = $this->extractRequestParams(); $payload = json_decode( $params['payload'], true );
        if ( !is_array( $payload ) ) { $this->dieWithError( 'Données de journal invalides.' ); }
        $config = MediaWikiServices::getInstance()->getMainConfig(); $key = (string)$config->get( 'PF2JournalsInternalKey' );
        if ( $key === '' ) { $this->dieWithError( 'PF2JournalsInternalKey n’est pas configurée.' ); }
        $number = rawurlencode( $params['number'] ); $method = $params['op'] === 'delete' ? 'DELETE' : 'PUT';
        $base = rtrim( $config->get( 'PF2JournalsApiBase' ), '/' );
        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create( $base . '/journals/admin/catalogue/' . $number, [ 'method' => $method, 'timeout' => 15, 'postData' => json_encode( $payload ), 'headers' => [ 'Content-Type' => 'application/json', 'X-PF2-Journals-Key' => $key ] ], __METHOD__ );
        $status = $request->execute(); $data = json_decode( $request->getContent(), true );
        if ( !$status->isOK() || !is_array( $data ) ) { $this->dieWithError( is_array( $data ) && isset( $data['message'] ) ? $data['message'] : 'Mise à jour des journaux impossible.' ); }
        $this->getResult()->addValue( null, 'pf2journalsupdate', $data );
    }
    public function getAllowedParams() { return [ 'op' => [ ApiBase::PARAM_TYPE => [ 'save', 'delete' ], ApiBase::PARAM_REQUIRED => true ], 'number' => [ ApiBase::PARAM_TYPE => 'integer', ApiBase::PARAM_REQUIRED => true ], 'payload' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ] ]; }
    public function needsToken() { return 'csrf'; }
    public function isWriteMode() { return true; }
}
