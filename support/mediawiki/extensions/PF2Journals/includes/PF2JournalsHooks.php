<?php
class PF2JournalsHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        $title = $out->getTitle();
        if ( $title && self::isJournalTitle( $title ) ) { $out->addModules( 'ext.pf2journals' ); }
    }
    public static function onGetUserPermissionsErrors( $title, $user, $action, &$result ): bool {
        if ( self::isJournalTitle( $title ) && in_array( $action, [ 'edit', 'move', 'delete' ], true ) ) {
            $result = [ 'badaccess-group0' ];
            return false;
        }
        return true;
    }
    private static function isJournalTitle( $title ): bool {
        $text = $title->getText();
        return $text === 'Journaux' || preg_match( '/^Journal-[0-9]+$/u', $text ) === 1;
    }
}
