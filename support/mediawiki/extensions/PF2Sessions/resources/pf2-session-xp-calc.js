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

    /**
     * Une ligne commence par « Objet : » (ou contient « objet trouvé ») pour
     * séparer la valeur totale des objets de l'argent dépensable. Les objets
     * ne sont PAS transformés fictivement en pièces d'or disponibles.
     *
     * Les monnaies PF2e sont : 1 pp = 10 po ; 1 po = 10 pa = 100 pc.
     * Exemple :
     *   Bandits : 12po, 5pa       => 12,5 po d'argent
     *   Objet : potion (4 po)     => 4 po de valeur d'équipement, pas de cash
     *   Potion : objet trouvé     => objet suivi, valeur non renseignée
     * La somme ne peut être complète tant que les objets n'ont pas de valeur.
     */
    function summarizeTreasure( text ) {
        var pattern = /(^|[^a-z0-9_])([+-]?\d+(?:[ \u00a0\u202f]\d{3})*(?:[.,]\d+)?)\s*(pp|po|pa|pc)\b/gi;
        var multipliers = { pp: 10, po: 1, pa: 0.1, pc: 0.01 };
        var cashGp = 0;
        var equipmentGp = 0;
        var amountCount = 0;
        var itemLines = 0;
        var unvaluedItemLines = 0;
        var lines = String( text || '' ).split( /\r?\n/ );

        lines.forEach( function ( line ) {
            var isItem = /^\s*(?:[-*•]\s*)?objets?\s*[:：\-–—]/i.test( line ) ||
                /\bobjets?\s+trouv(?:é|ée|és|ées)(?:\s|$|[.,;!?])/i.test( line );
            var lineTotal = 0;
            var lineCount = 0;
            var match;
            pattern.lastIndex = 0;
            while ( ( match = pattern.exec( line ) ) !== null ) {
                var amount = Number( match[ 2 ].replace( /[ \u00a0\u202f]/g, '' ).replace( ',', '.' ) );
                if ( Number.isFinite( amount ) ) {
                    lineTotal += amount * multipliers[ match[ 3 ].toLowerCase() ];
                    lineCount += 1;
                    amountCount += 1;
                }
            }
            if ( isItem ) {
                itemLines += 1;
                equipmentGp += lineTotal;
                if ( lineCount === 0 ) {
                    unvaluedItemLines += 1;
                }
            } else {
                cashGp += lineTotal;
            }
        } );

        var roundGp = function ( value ) { return Math.round( value * 100 ) / 100; };
        return {
            cashGp: roundGp( cashGp ),
            equipmentGp: roundGp( equipmentGp ),
            combinedGp: roundGp( cashGp + equipmentGp ),
            itemLines: itemLines,
            unvaluedItemLines: unvaluedItemLines,
            amountCount: amountCount
        };
    }

    scope.PF2SessionXpCalculator = {
        summarize: summarize,
        summarizeTreasure: summarizeTreasure
    };
}( typeof window !== 'undefined' ? window : globalThis ) );
