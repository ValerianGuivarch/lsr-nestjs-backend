<?php

use MediaWiki\MediaWikiServices;

class SpecialPF2DiscordLogin extends SpecialPage {
    public function __construct() {
        parent::__construct( 'PF2DiscordLogin' );
    }

    public function execute( $subPage ) {
        $this->setHeaders();

        $output = $this->getOutput();
        $request = $this->getRequest();
        $grant = trim( (string)$request->getVal( 'grant', '' ) );

        if ( $grant === '' ) {
            $output->addWikiTextAsInterface( 'Lien de connexion manquant.' );
            return;
        }

        $services = MediaWikiServices::getInstance();
        $config = $services->getMainConfig();
        $base = rtrim( (string)$config->get( 'PF2SessionsApiBase' ), '/' );
        $key = getenv( 'PF2_WIKI_LOGIN_INTERNAL_KEY' ) ?: getenv( 'PF2_JOURNALS_INTERNAL_KEY' ) ?: '';

        if ( $base === '' || $key === '' ) {
            $output->addWikiTextAsInterface( 'La connexion Discord au wiki n’est pas configurée.' );
            return;
        }

        $client = $services->getHttpRequestFactory()->create(
            $base . '/wiki-login/consume',
            [
                'method' => 'POST',
                'timeout' => 10,
                'postData' => json_encode( [ 'grant' => $grant ] ),
            ],
            __METHOD__
        );
        $client->setHeader( 'Content-Type', 'application/json' );
        $client->setHeader( 'X-PF2-Wiki-Key', $key );

        $status = $client->execute();
        if ( !$status->isOK() ) {
            $output->addWikiTextAsInterface(
                'Ce lien de connexion est invalide, expiré ou a déjà été utilisé. Relance `/wiki` dans Discord.'
            );
            return;
        }

        $payload = json_decode( $client->getContent(), true );
        $wikiUsername = is_array( $payload )
            ? trim( (string)( $payload['wikiUsername'] ?? '' ) )
            : '';

        if ( $wikiUsername === '' ) {
            $output->addWikiTextAsInterface( 'Le compte Wiki associé est introuvable.' );
            return;
        }

        $user = $services->getUserFactory()->newFromName( $wikiUsername );
        if ( !$user || !$user->isRegistered() ) {
            $output->addWikiTextAsInterface( 'Le compte Wiki associé n’existe plus.' );
            return;
        }

        $session = $request->getSession();
        if ( !$session->canSetUser() ) {
            $output->addWikiTextAsInterface( 'Cette session navigateur ne peut pas être authentifiée.' );
            return;
        }

        $session->renew();
        $session->setUser( $user );
        $session->persist();

        $output->redirect( $services->getTitleFactory()->newMainPage()->getFullURL() );
    }
}
