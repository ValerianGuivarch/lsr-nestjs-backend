( function ( scope ) {
    'use strict';

    /**
     * Les montants sont des récompenses de GROUPE.
     * Accepte « 30XP », « 200 XP », « 2 000 xp », « 12,5XP ».
     * N'interprète ni les nombres isolés ni XPC (XP de carrière).
     */
    function summarize( text ) {
        var pattern = /(^|[^a-z0-9_])([+-]?\d+(?:[ \u00a0\u202f]\d{3})*(?:[.,]\d+)?)\s*xp\b/gi;
        var value = String( text || '' );
        var total = 0;
        var count = 0;
        var match;

        while ( ( match = pattern.exec( value ) ) !== null ) {
            var number = Number( match[ 2 ].replace( /[ \u00a0\u202f]/g, '' ).replace( ',', '.' ) );
            if ( Number.isFinite( number ) ) {
                total += number;
                count += 1;
            }
        }
        return { total: Math.round( total * 100 ) / 100, count: count };
    }

    scope.PF2SessionXpCalculator = { summarize: summarize };
}( typeof window !== 'undefined' ? window : globalThis ) );
