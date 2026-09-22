<?php
class PF2JournalsHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        $title = $out->getTitle();
        if ( $title && self::isJournalTitle( $title ) ) { $out->addModules( 'ext.pf2journals' ); }
    }
    public static function onGetUserPermissionsErrors( $title, $user, $action, &$errors, $rigor = null ): bool {
        if ( self::isJournalTitle( $title ) && in_array( $action, [ 'edit', 'move', 'delete' ], true ) ) { $errors[] = [ 'badaccess-group0' ]; }
        return true;
    }
    private static function isJournalTitle( $title ): bool {
        $text = $title->getText();
        return $text === 'Journaux' || preg_match( '/^Journal-[0-9]+$/u', $text ) === 1;
    }
}
