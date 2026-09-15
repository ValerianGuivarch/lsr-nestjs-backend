<?php

use MediaWiki\MediaWikiServices;

class ApiPF2Sessions extends ApiBase {
    public function execute() {
        $config = MediaWikiServices::getInstance()->getMainConfig();
        $base = rtrim( $config->get( 'PF2SessionsApiBase' ), '/' );
        $user = $this->getUser();
        $canContribute = $user->isRegistered();
        $canAdmin = $canContribute && $user->isAllowed( 'pf2sessions-admin' );
        // Les brouillons font partie de la chronologie publique : publication
        // contrôle l'envoi/validation finale, pas le droit de lecture.
        // Les métadonnées MJ (scénario/composant) restent réservées aux admins.
        $url = $base . '/wiki/sessions?includeDrafts=1';

        $request = MediaWikiServices::getInstance()->getHttpRequestFactory()->create(
            $url,
            [ 'method' => 'GET', 'timeout' => 10 ],
            __METHOD__
        );
        $status = $request->execute();
        if ( !$status->isOK() ) {
            $this->dieWithError( 'Impossible de charger les séances PF2.' );
        }

        $data = json_decode( $request->getContent(), true );
        if ( !is_array( $data ) || !isset( $data['sessions'] ) || !is_array( $data['sessions'] ) ) {
            $this->dieWithError( 'Réponse PF2 invalide.' );
        }

        // ApiResult traite les booléens comme des flags MediaWiki.
        // Les convertir explicitement en 0/1 pour le client JavaScript.
        foreach ( $data['sessions'] as &$session ) {
            $session['published'] = !empty( $session['published'] ) ? 1 : 0;
            if ( !$canAdmin ) {
                unset( $session['content'] );
            }
        }
        unset( $session );

        if ( !$canAdmin ) {
            $data['scenarios'] = [];
        }
        $data['canContribute'] = $canContribute ? 1 : 0;
        $data['canAdmin'] = $canAdmin ? 1 : 0;
        // Compatibilité avec un ancien JS mis en cache : ne jamais lui ouvrir les droits admin.
        $data['canEdit'] = $canAdmin ? 1 : 0;
        $this->getResult()->addValue( null, 'pf2sessions', $data );
    }

    public function isReadMode() {
        return true;
    }
}
