<?php

use MediaWiki\MediaWikiServices;

class ApiPF2PlayerCodexUpdate extends ApiBase {
    public function execute() {
        // Keep this before all MediaWiki calls: it confirms that the deployed
        // extension is the expected version even if an early framework call
        // fails with a generic internal_api_error.
        error_log( '[PF2PlayerCodex] pf2playercodexupdate entered' );
        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'delete' ) ) {
            $this->dieWithError( 'Vous devez être administrateur pour modifier le carnet.' );
        }

        $params = $this->extractRequestParams();
        $payload = json_decode( $params['payload'], true );
        if ( !is_array( $payload ) ) {
            $this->dieWithError( 'Données invalides.' );
        }

        $op = $params['op'];
        $routes = [
            'createFaction' => [ 'POST', '/player-codex/factions' ],
            'updateFaction' => [ 'PATCH', '/player-codex/factions/' . rawurlencode( $params['id'] ) ],
            'deleteFaction' => [ 'DELETE', '/player-codex/factions/' . rawurlencode( $params['id'] ) ],
            'deleteCharacter' => [ 'DELETE', '/player-codex/characters/' . rawurlencode( $params['id'] ) ],
            'addFaction' => [ 'POST', '/player-codex/characters/' . rawurlencode( $params['id'] ) . '/factions' ],
            'removeFaction' => [ 'DELETE', '/player-codex/characters/' . rawurlencode( $params['id'] ) . '/factions/' . rawurlencode( $params['target'] ) ],
        ];
        if ( !isset( $routes[$op] ) ) {
            $this->dieWithError( 'Opération inconnue.' );
        }

        $body = json_encode( $payload );
        if ( $body === false ) {
            $this->dieWithError( 'Données impossibles à sérialiser.' );
        }

        [ $method, $path ] = $routes[$op];
        $base = rtrim( MediaWikiServices::getInstance()->getMainConfig()->get( 'PF2PlayerCodexApiBase' ), '/' );
        $url = $base . $path;
        $this->log( 'Début proxy op=' . $op . ' id=' . $params['id'] . ' target=' . $params['target'] . ' method=' . $method . ' url=' . $url );

        try {
            $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
                $url,
                [
                    'method' => $method,
                    'timeout' => 15,
                    'postData' => $body,
                    'headers' => [ 'Content-Type' => 'application/json' ],
                ],
                __METHOD__
            );
            $status = $request->execute();
            $content = (string)$request->getContent();
            $data = json_decode( $content, true );

            $this->log( 'Réponse proxy op=' . $op . ' ok=' . ( $status->isOK() ? '1' : '0' ) . ' body=' . $this->shortLog( $content ) );

            if ( !$status->isOK() || !is_array( $data ) ) {
                $message = is_array( $data ) && isset( $data['message'] )
                    ? $data['message']
                    : 'Mise à jour du carnet impossible.';
                throw new \RuntimeException( $message );
            }

            $this->getResult()->addValue( null, 'pf2', $data );
        } catch ( \Throwable $error ) {
            $this->log( 'Erreur proxy op=' . $op . ' id=' . $params['id'] . ' exception=' . get_class( $error ) . ' message=' . $error->getMessage() );
            $this->dieWithError( 'Mise à jour du carnet impossible : ' . $error->getMessage() );
        }
    }

    private function log( $message ) {
        $line = '[PF2PlayerCodex] ' . $message;
        // Native PHP logging must never prevent the API proxy from running.
        // In particular, wfDebugLog is not available in every MediaWiki runtime
        // used by this extension.
        error_log( $line );
    }

    private function shortLog( $value ) {
        return substr( preg_replace( '/\s+/', ' ', $value ), 0, 800 );
    }

    public function getAllowedParams() {
        return [
            'op' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
            'id' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DEFAULT => '' ],
            'target' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_DEFAULT => '' ],
            'payload' => [ ApiBase::PARAM_TYPE => 'string', ApiBase::PARAM_REQUIRED => true ],
        ];
    }

    public function needsToken() { return 'csrf'; }
    public function isWriteMode() { return true; }
}
