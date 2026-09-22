<?php
use MediaWiki\MediaWikiServices;
class ApiPF2Journals extends ApiBase {
    public function execute() {
        $config = MediaWikiServices::getInstance()->getMainConfig(); $base = rtrim( $config->get( 'PF2JournalsApiBase' ), '/' ); $number = $this->getRequest()->getInt( 'number', 0 ); $adminCatalogue = $this->getRequest()->getBool( 'admin', false );
        $canAdmin = $this->getUser()->isRegistered() && $this->getUser()->isAllowed( 'delete' );
        $headers = [];
        if ( ( $number > 0 || $adminCatalogue ) && $canAdmin && (string)$config->get( 'PF2JournalsInternalKey' ) !== '' ) { $headers['X-PF2-Journals-Key'] = (string)$config->get( 'PF2JournalsInternalKey' ); }
        if ( $adminCatalogue && !$canAdmin ) { $this->dieWithError( 'Vous devez être administrateur pour éditer les journaux.' ); }
        $url = $adminCatalogue ? $base . '/journals/admin/catalogue' : ( $number > 0 ? $base . '/journals/' . rawurlencode( (string)$number ) : $base . '/journals' );
        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create( $url, [ 'method' => 'GET', 'timeout' => 10, 'headers' => $headers ], __METHOD__ ); $status = $request->execute();
        if ( !$status->isOK() ) { $this->dieWithError( 'Impossible de charger les journaux PF2.' ); }
        $data = json_decode( $request->getContent(), true ); if ( !is_array( $data ) ) { $this->dieWithError( 'Réponse Journaux PF2 invalide.' ); }
        $this->getResult()->addValue( null, 'pf2journals', [ 'data' => $data, 'canAdmin' => $canAdmin ? 1 : 0 ] );
    }
    public function isReadMode() { return true; }
}
