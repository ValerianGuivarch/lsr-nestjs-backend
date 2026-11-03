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
                '<p>Écris librement ce qui s’est passé. Chaque nombre suivi de <code>XP</code> ' +
                    '(avec ou sans espace, majuscules indifférentes) est additionné en direct. ' +
                    'Exemple : « Aider le gnome 30XP ; vaincre le chef 200 XP ».</p>' +
                '<label for="pf2-xp-notes">Notes de la séance</label>' +
                '<textarea id="pf2-xp-notes" rows="13" spellcheck="true" ' +
                    'placeholder="Gnome libéré : 30XP\nÉnigme résolue : 100 XP\nChef vaincu : 350xp"></textarea>' +
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
            '</section>';

        root.querySelector( '[data-return]' ).addEventListener( 'click', function () {
            window.history.back();
        } );

        var textarea = root.querySelector( '#pf2-xp-notes' );
        textarea.value = savedDraft();

        function update() {
            var result = calculator.summarize( textarea.value );
            var total = result.total;
            root.querySelector( '[data-total]' ).textContent = number( total ) + ' XP';
            root.querySelector( '[data-per-player]' ).textContent = count ?
                number( total / count ) + ' XP' : '—';
            var differenceNode = root.querySelector( '[data-difference]' );
            var comment = root.querySelector( '[data-comment]' );

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
