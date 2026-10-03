<?php

class SpecialPF2MyCharacters extends SpecialPage {
    public function __construct() {
        parent::__construct( 'MesPersonnages' );
    }

    public function execute( $subPage ) {
        $this->setHeaders();
        $output = $this->getOutput();
        $user = $this->getUser();

        if ( !$user->isRegistered() ) {
            $output->setPageTitle( 'Mes personnages' );
            $output->addWikiTextAsInterface( 'Vous devez être connecté pour voir vos personnages.' );
            return;
        }

        $characterId = trim( (string)$subPage );
        $output->setPageTitle( $characterId === '' ? 'Mes personnages' : 'Mon personnage' );
        $output->addHTML(
            '<div id="pf2-my-characters-special" data-character-id="' .
            htmlspecialchars( $characterId, ENT_QUOTES ) .
            '"></div>'
        );
    }
}
