<?php

class PF2SessionsHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        $out->addModules( 'ext.pf2sessions' );
    }
}
