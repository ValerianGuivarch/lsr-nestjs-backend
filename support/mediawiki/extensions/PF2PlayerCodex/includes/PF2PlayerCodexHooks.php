<?php
class PF2PlayerCodexHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        $out->addModules( 'ext.pf2playercodex' );
        if ($out->getTitle() && $out->getTitle()->getPrefixedDBkey() === 'Réputation') { $out->addModules( 'ext.pf2reputations' ); }
    }
}
