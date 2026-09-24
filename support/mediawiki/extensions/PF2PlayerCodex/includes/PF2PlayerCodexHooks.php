<?php
class PF2PlayerCodexHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        $out->addModules( 'ext.pf2playercodex' );
    }
}
