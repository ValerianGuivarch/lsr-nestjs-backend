<?php

/**
 * Special:PF2SessionXp — admin-only private XP scratchpad for one wiki session.
 */
class SpecialPF2SessionXp extends SpecialPage {
    public function __construct() {
        parent::__construct( 'PF2SessionXp' );
    }

    public function execute( $subPage ) {
        $this->setHeaders();
        $output = $this->getOutput();
        $output->setPageTitle( 'Aide XP — Outil MJ' );

        $user = $this->getUser();
        if ( !$user->isRegistered() || !$user->isAllowed( 'pf2sessions-admin' ) ) {
            $output->addWikiTextAsInterface( 'Cette page est réservée aux administrateurs du wiki.' );
            return;
        }

        $sessionId = trim( (string)$this->getRequest()->getVal( 'session', '' ) );
        if ( !preg_match( '/^[a-f0-9-]{36}$/i', $sessionId ) ) {
            $output->addWikiTextAsInterface( 'Aucune séance valide sélectionnée. Utilisez le bouton « Outil MJ · XP » depuis la liste des séances.' );
            return;
        }

        $output->addModules( 'ext.pf2sessions.xp' );
        $output->addHTML(
            '<div id="pf2-xp-aid" data-session-id="' .
            htmlspecialchars( $sessionId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8' ) .
            '"><p>Chargement des participants et des paliers…</p></div>'
        );
    }
}
