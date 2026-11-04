( function () {
    'use strict';

    var root = document.getElementById( 'pf2-xp-aid' );
    if ( !root ) {
        return;
    }

    var sessionId = root.dataset.sessionId;
    var api = new mw.Api();
    var calculator = window.PF2SessionXpCalculator;
    var format = new Intl.NumberFormat( 'fr-FR', { maximumFractionDigits: 2 } );
    var storageKey = 'pf2-session-xp-aid:' + String( mw.config.get( 'wgUserId' ) || '' ) +
        ':' + sessionId;

    function escapeHtml( value ) {
        var node = document.createElement( 'span' );
        node.textContent = value === null || value === undefined ? '' : String( value );
        return node.innerHTML;
    }

    function number( value ) {
        return format.format( Number( value ) || 0 );
    }

    function savedDraft() {
        try {
            return sessionStorage.getItem( storageKey ) || '';
        } catch ( error ) {
            return '';
        }
    }

    function storeDraft( text ) {
        try {
            sessionStorage.setItem( storageKey, text );
        } catch ( error ) {
            // Le calcul continue même si le navigateur interdit le stockage.
        }
    }

    function participantsHtml( data ) {
        if ( !data.participantCount ) {
            return '<p class="pf2-xp-warning">Aucun PJ n’est associé à cette séance. ' +
                'Ajoute d’abord les participants depuis la liste des séances pour obtenir un budget.</p>';
        }
        return '<div class="pf2-xp-participants"><table class="wikitable">' +
            '<thead><tr><th>Personnage</th><th>Niveau au début</th><th>Palier actuel</th>' +
            '<th>Palier suivant</th><th>Écart</th></tr></thead><tbody>' +
            data.participants.map( function ( participant ) {
                return '<tr><td>' + escapeHtml( participant.name ) + '</td>' +
                    '<td>' + number( participant.level ) + '</td>' +
                    '<td>' + number( participant.currentThreshold ) + '</td>' +
                    '<td>' + number( participant.nextThreshold ) + '</td>' +
                    '<td><strong>' + number( participant.xpToNextLevelBand ) + ' XP</strong></td></tr>';
            } ).join( '' ) +
            '</tbody></table></div>';
    }

    function render( data ) {
        var count = Number( data.participantCount || 0 );
        var hasBudget = count > 0 && data.targetGroupXp !== null;
        var target = hasBudget ? Number( data.targetGroupXp ) : 0;
        var average = data.averageLevel === null ? '—' : number( data.averageLevel );
        var treasure = data.treasure || null;
        var hasTreasureBudget = Boolean( treasure && treasure.currencyBudgetGp !== null &&
            treasure.totalBudgetGp !== null && count > 0 );
        var currencyTarget = hasTreasureBudget ? Number( treasure.currencyBudgetGp ) : 0;
        var treasureTarget = hasTreasureBudget ? Number( treasure.totalBudgetGp ) : 0;
        var treasureNotice = treasure && treasure.unsupportedLevels && treasure.unsupportedLevels.length ?
            'Le GM Core ne fournit pas de barème au-delà du niveau 20 (niveaux non couverts : ' +
                treasure.unsupportedLevels.map( number ).join( ', ' ) + '). Aucun budget inventé.' :
            !count ? 'Renseigne les participants pour calculer le budget de trésors.' :
            'En attente des montants de trésor du serveur.';

        root.innerHTML =
            '<div class="pf2-xp-header">' +
                '<button type="button" class="pf2-button" data-return>← Retour aux séances</button>' +
                '<p class="pf2-xp-kicker">Outil privé du MJ · séance ' + number( data.sessionNumber ) + '</p>' +
                '<h2>' + escapeHtml( data.sessionTitle || 'Séance ' + data.sessionNumber ) + '</h2>' +
                '<p>Estimation indicative : une montée de niveau environ toutes les ' +
                    number( data.sessionsPerLevelTarget ) + ' séances. Aucun XP n’est attribué depuis cette page.</p>' +
            '</div>' +
            '<div class="pf2-xp-facts">' +
                '<div><span>Participants</span><strong>' + number( count ) + '</strong></div>' +
                '<div><span>Niveau moyen</span><strong>' + average + '</strong></div>' +
                '<div><span>Budget du groupe</span><strong>' +
                    ( hasBudget ? number( target ) + ' XP' : '—' ) + '</strong></div>' +
                '<div><span>Équivalent par PJ</span><strong>' +
                    ( hasBudget ? number( data.targetXpPerPlayer ) + ' XP' : '—' ) + '</strong></div>' +
            '</div>' +
            '<h3>Calcul à partir des participants</h3>' +
            participantsHtml( data ) +
            ( hasBudget ?
                '<p class="pf2-xp-formula">Somme des écarts au niveau supérieur : ' +
                    '<strong>' + number( data.totalLevelBands ) + '</strong> ÷ ' +
                    number( data.sessionsPerLevelTarget ) + ' = <strong>' +
                    number( target ) + ' XP pour le groupe</strong>, soit ' +
                    number( data.targetXpPerPlayer ) + ' XP par PJ.</p>' :
                '' ) +
            '<section class="pf2-xp-editor">' +
                '<h3>Récompenses improvisées</h3>' +
                '<p>Un seul brouillon pour noter tes récompenses : <code>30XP</code> ' +
                    'pour l’expérience, <code>12po</code> ou <code>5 pa</code> pour les pièces, ' +
                    '<code>Objet : potion (4 po)</code> pour un équipement valorisé. ' +
                    'Le total se met à jour à chaque frappe.</p>' +
                '<label for="pf2-xp-notes">Notes de la séance (XP, argent et objets)</label>' +
                '<textarea id="pf2-xp-notes" rows="13" spellcheck="true" ' +
                    'placeholder="Gnome libéré : 30XP\nBandits : 12po\nRécompense : 25 po\nObjet : potion de soins (4 po)"></textarea>' +
                '<div class="pf2-xp-live" aria-live="polite">' +
                    '<div><span>Total saisi pour le groupe</span><strong data-total>0 XP</strong></div>' +
                    '<div><span>Par PJ</span><strong data-per-player>0 XP</strong></div>' +
                    '<div><span>Écart au budget</span><strong data-difference>—</strong></div>' +
                    '<p data-comment></p>' +
                    ( hasBudget ? '<progress data-progress max="' + Math.max( 1, target ) +
                        '" value="0"></progress>' : '' ) +
                '</div>' +
                '<small class="pf2-xp-disclaimer">Brouillon conservé uniquement dans cet onglet du navigateur. ' +
                    'Pas de bouton de validation, aucune écriture dans la séance ni sur Discord/Foundry.</small>' +
            '</section>' +
            '<section class="pf2-xp-editor pf2-xp-treasure">' +
                '<h3>Trésors et or · GM Core</h3>' +
                '<p>Objectifs indicatifs <strong>pour le groupe entier et pour cette séance</strong>, ' +
                    'd’après la table 10-9 (trésors distribués sur un niveau, divisés par ' +
                    '2,5 séances). Le trésor total comprend l’argent <em>et</em> les objets.</p>' +
                '<div class="pf2-xp-facts pf2-xp-treasure-targets">' +
                    '<div><span>Argent / valeurs vendables</span><strong>' +
                        ( hasTreasureBudget ? number( currencyTarget ) + ' po' : '—' ) + '</strong></div>' +
                    '<div><span>Trésor total (objets compris)</span><strong>' +
                        ( hasTreasureBudget ? number( treasureTarget ) + ' po' : '—' ) + '</strong></div>' +
                    '<div><span>Part du budget destinée aux objets</span><strong>' +
                        ( hasTreasureBudget ? number( treasure.equipmentBudgetGp ) + ' po' : '—' ) + '</strong></div>' +
                    '<div><span>Argent indicatif par PJ</span><strong>' +
                        ( hasTreasureBudget ? number( treasure.currencyPerPlayerGp ) + ' po' : '—' ) + '</strong></div>' +
                '</div>' +
                ( hasTreasureBudget ?
                    '<p class="pf2-xp-formula">Pour chaque PJ, on prend la ligne de son niveau dans ' +
                        '<a href="https://pathfinder2e.org/browse/tables/p.html" target="_blank" rel="noreferrer">' +
                        'la table de trésors du GM Core</a>. La moyenne des budgets du groupe de quatre ' +
                        'est répartie sur 2,5 séances. ' +
                        ( count !== 4 ? '<strong>Adaptation maison proportionnelle à ' + count +
                            ' participants</strong> : pour les groupes de taille différente, ' +
                            'la règle officielle distingue notamment des objets et pièces supplémentaires.' :
                            'Référence officielle : groupe de quatre PJ du même niveau ; ' +
                            'l’utilisation de niveaux différents est ton adaptation maison.' ) + '</p>' :
                    '<p class="pf2-xp-warning">' + escapeHtml( treasureNotice ) + '</p>' ) +
                '<div class="pf2-xp-live pf2-xp-treasure-live" aria-live="polite">' +
                    '<div><span>Argent prévu dans les notes</span><strong data-treasure-cash>0 po</strong></div>' +
                    '<div><span>Valeur déclarée des objets</span><strong data-treasure-equipment>0 po</strong></div>' +
                    '<div><span>Total valorisé</span><strong data-treasure-combined>0 po</strong></div>' +
                    '<div><span>Écart au budget argent</span><strong data-treasure-cash-diff>—</strong></div>' +
                    '<div><span>Écart au trésor total</span><strong data-treasure-total-diff>—</strong></div>' +
                    '<div><span>Objets repérés</span><strong data-treasure-items>0</strong></div>' +
                    '<p data-treasure-comment></p>' +
                    ( hasTreasureBudget ?
                        '<label for="pf2-treasure-cash-progress">Argent</label>' +
                        '<progress id="pf2-treasure-cash-progress" data-treasure-cash-progress max="' +
                            Math.max( 1, currencyTarget ) + '" value="0"></progress>' +
                        '<label for="pf2-treasure-total-progress">Trésor total</label>' +
                        '<progress id="pf2-treasure-total-progress" data-treasure-total-progress max="' +
                            Math.max( 1, treasureTarget ) + '" value="0"></progress>' : '' ) +
                '</div>' +
                '<small class="pf2-xp-disclaimer">Pièces et valeurs monétaires : ' +
                    '<code>1pp = 10po</code>, <code>10pa = 1po</code>, <code>100pc = 1po</code>. ' +
                    'Une ligne <code>Objet : baguette (25po)</code> ajoute 25 po de valeur ' +
                    'd’équipement au trésor total, <strong>pas</strong> à l’argent disponible. ' +
                    'Un objet sans prix reste listé mais ne peut pas compléter la somme ; ' +
                    'renseigne son prix en po pour une comparaison exhaustive.</small>' +
            '</section>';

        root.querySelector( '[data-return]' ).addEventListener( 'click', function () {
            window.history.back();
        } );

        var textarea = root.querySelector( '#pf2-xp-notes' );
        textarea.value = savedDraft();

        function update() {
            var result = calculator.summarize( textarea.value );
            var treasureRewards = calculator.summarizeTreasure( textarea.value );
            var total = result.total;
            root.querySelector( '[data-total]' ).textContent = number( total ) + ' XP';
            root.querySelector( '[data-per-player]' ).textContent = count ?
                number( total / count ) + ' XP' : '—';
            var differenceNode = root.querySelector( '[data-difference]' );
            var comment = root.querySelector( '[data-comment]' );

            root.querySelector( '[data-treasure-cash]' ).textContent = number( treasureRewards.cashGp ) + ' po';
            root.querySelector( '[data-treasure-equipment]' ).textContent = number( treasureRewards.equipmentGp ) + ' po';
            root.querySelector( '[data-treasure-combined]' ).textContent = number( treasureRewards.combinedGp ) + ' po';
            root.querySelector( '[data-treasure-items]' ).textContent = number( treasureRewards.itemLines );
            var cashDifference = root.querySelector( '[data-treasure-cash-diff]' );
            var totalDifference = root.querySelector( '[data-treasure-total-diff]' );
            var treasureComment = root.querySelector( '[data-treasure-comment]' );
            var unpriced = treasureRewards.unvaluedItemLines;
            var partialNote = unpriced ? unpriced + ' ligne(s) d’objet(s) sans prix : total incomplet. ' : '';
            if ( hasTreasureBudget ) {
                var cashDelta = Math.round( ( treasureRewards.cashGp - currencyTarget ) * 100 ) / 100;
                var totalDelta = Math.round( ( treasureRewards.combinedGp - treasureTarget ) * 100 ) / 100;
                cashDifference.textContent = ( cashDelta > 0 ? '+' : '' ) + number( cashDelta ) + ' po';
                totalDifference.textContent = ( totalDelta > 0 ? '+' : '' ) + number( totalDelta ) + ' po';
                treasureComment.textContent = partialNote +
                    ( cashDelta < 0 ? 'Il reste ' + number( -cashDelta ) + ' po pour atteindre l’objectif d’argent.' :
                        cashDelta > 0 ? 'L’objectif d’argent est dépassé de ' + number( cashDelta ) + ' po.' :
                            'Objectif d’argent atteint.' );
                root.querySelector( '[data-treasure-cash-progress]' ).value =
                    Math.min( currencyTarget, Math.max( 0, treasureRewards.cashGp ) );
                root.querySelector( '[data-treasure-total-progress]' ).value =
                    Math.min( treasureTarget, Math.max( 0, treasureRewards.combinedGp ) );
            } else {
                cashDifference.textContent = '—';
                totalDifference.textContent = '—';
                treasureComment.textContent = partialNote + treasureNotice;
            }

            if ( !hasBudget ) {
                differenceNode.textContent = '—';
                comment.textContent = result.count + ' montant(s) XP repéré(s). Participants à renseigner.';
                return;
            }

            var difference = Math.round( ( total - target ) * 100 ) / 100;
            differenceNode.textContent = ( difference > 0 ? '+' : '' ) + number( difference ) + ' XP';
            if ( difference > 0 ) {
                comment.textContent = 'Au-dessus du budget indicatif de ' + number( difference ) + ' XP.' +
                    ' Tu restes libre de récompenser davantage.';
            } else if ( difference < 0 ) {
                comment.textContent = 'Il reste ' + number( -difference ) +
                    ' XP avant le budget indicatif. ' + result.count + ' montant(s) repéré(s).';
            } else {
                comment.textContent = 'Budget indicatif atteint (' + result.count + ' montant(s)).';
            }
            var progress = root.querySelector( '[data-progress]' );
            if ( progress ) {
                progress.value = Math.min( target, Math.max( 0, total ) );
            }
        }

        textarea.addEventListener( 'input', function () {
            storeDraft( textarea.value );
            update();
        } );
        update();
    }

    api.get( {
        action: 'pf2sessionxp',
        format: 'json',
        id: sessionId
    } ).then( function ( result ) {
        var data = result && result.pf2sessionxp;
        if ( !data || data.sessionId !== sessionId || !Array.isArray( data.participants ) ) {
            throw new Error( 'Réponse XP invalide.' );
        }
        render( data );
    } ).catch( function ( error ) {
        root.innerHTML = '<div class="errorbox">Impossible de charger l’outil XP. Vérifie ' +
            'ton accès administrateur et les participants de la séance.</div>';
        mw.log.warn( '[PF2SessionXp] Erreur de chargement', error );
    } );
}() );
