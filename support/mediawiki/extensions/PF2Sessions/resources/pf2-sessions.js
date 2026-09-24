( function () {
    'use strict';

    var root = document.getElementById( 'pf2-sessions' );
    if ( !root ) {
        return;
    }

    var api = new mw.Api();
    var state = { sessions: [], actors: [], scenarios: [], canContribute: false, canAdmin: false };

    function escapeHtml( value ) {
        var div = document.createElement( 'div' );
        div.textContent = value == null ? '' : String( value );
        return div.innerHTML;
    }

    function longSummaryTitle( session ) {
        return 'Séance:' + Number( session.sessionNumber );
    }

    function addLongSummaryLink( article, session ) {
        var actions = article.querySelector( '.pf2-session-actions' );
        if ( !actions ) {
            return;
        }

        var title = longSummaryTitle( session );
        var link = document.createElement( 'a' );

        link.className = 'pf2-button pf2-long-summary-link';
        link.textContent = 'Résumé long';
        link.dataset.wikiTitle = title;
        link.href = mw.util.getUrl( title );

        actions.appendChild( link );
    }

    function refreshLongSummaryLinks() {
        var links = Array.from(
            root.querySelectorAll( '.pf2-long-summary-link[data-wiki-title]' )
        );

        if ( !links.length ) {
            return;
        }

        var titles = links.map( function ( link ) {
            return link.dataset.wikiTitle;
        } );

        var wikiApi = new mw.Api();

        wikiApi.get( {
            action: 'query',
            format: 'json',
            formatversion: 2,
            titles: titles.join( '|' )
        } ).then( function ( response ) {
            var pages = response &&
                response.query &&
                Array.isArray( response.query.pages )
                ? response.query.pages
                : [];

            var existing = new Map();

            pages.forEach( function ( page ) {
                existing.set( page.title, !page.missing );
            } );

            links.forEach( function ( link ) {
                var title = link.dataset.wikiTitle;
                var exists = existing.get( title ) === true;

                if ( exists ) {
                    link.classList.remove( 'new' );
                    link.href = mw.util.getUrl( title );
                    link.title = 'Lire le résumé long';
                } else {
                    if ( !state.canContribute ) {
                        link.remove();
                        return;
                    }
                    link.classList.add( 'new' );
                    link.href = mw.util.getUrl( title, {
                        action: 'edit',
                        redlink: 1
                    } );
                    link.title = 'Créer le résumé long';
                }
            } );
        } );
    }

    function formatDate( value ) {
        if ( !value ) {
            return 'Non renseignée';
        }
        var parts = value.split( '-' );
        return parts.length === 3 ? parts[ 2 ] + '/' + parts[ 1 ] + '/' + parts[ 0 ] : value;
    }

    function displayValue( value ) {
        return value === null || value === undefined || value === ''
            ? '<span class="pf2-missing">Non renseigné</span>'
            : escapeHtml( value );
    }

    function summaryRewardText( level, xp ) {
        if ( level === null || level === undefined || level === '' ) {
            return '—';
        }
        return 'Niveau ' + level + ' (+' + Number( xp || 0 ) + ' XP)';
    }

    function actorName( uuid ) {
        var actor = state.actors.find( function ( item ) { return item.uuid === uuid; } );
        return actor ? actor.name : uuid;
    }

    function selectOptions( selected, allowEmpty ) {
        var html = allowEmpty ? '<option value="">— Non renseigné —</option>' : '';
        return html + state.actors.map( function ( actor ) {
            return '<option value="' + escapeHtml( actor.uuid ) + '"' +
                ( actor.uuid === selected ? ' selected' : '' ) + '>' +
                escapeHtml( actor.name ) + '</option>';
        } ).join( '' );
    }

    function scenarioById( id ) {
        return state.scenarios.find( function ( item ) { return item.id === id; } ) || null;
    }

    function scenarioDisplayName( scenario ) {
        if ( !scenario ) {
            return '';
        }
        return scenario.campaignTitle
            ? scenario.campaignTitle + ' — ' + scenario.title
            : scenario.title;
    }

    function scenarioOptions( selected ) {
        var groups = new Map();
        state.scenarios.forEach( function ( scenario ) {
            var label = scenario.campaignTitle || 'Aventures indépendantes';
            var list = groups.get( label ) || [];
            list.push( scenario );
            groups.set( label, list );
        } );

        var html = '<option value="">— Choisir —</option>';
        Array.from( groups.entries() ).forEach( function ( pair ) {
            html += '<optgroup label="' + escapeHtml( pair[ 0 ] ) + '">';
            pair[ 1 ].forEach( function ( scenario ) {
                html += '<option value="' + escapeHtml( scenario.id ) + '"' +
                    ( scenario.id === selected ? ' selected' : '' ) + '>' +
                    escapeHtml( scenario.title ) + '</option>';
            } );
            html += '</optgroup>';
        } );
        return html;
    }

    function componentOptions( scenarioId, selected ) {
        var scenario = scenarioById( scenarioId );
        var components = scenario && Array.isArray( scenario.playableComponents )
            ? scenario.playableComponents
            : [];
        var html = '<option value="">Scénario entier / non précisé</option>';
        components.forEach( function ( component ) {
            html += '<option value="' + escapeHtml( component.id ) + '"' +
                ( component.id === selected ? ' selected' : '' ) + '>' +
                escapeHtml( component.title ) + '</option>';
        } );
        return html;
    }

    function sessionContentHtml( session ) {
        var links = Array.isArray( session.content ) ? session.content : [];
        if ( !links.length ) {
            return '';
        }
        var badges = links.map( function ( link ) {
            var scenario = scenarioById( link.scenarioId );
            var component = scenario && Array.isArray( scenario.playableComponents )
                ? scenario.playableComponents.find( function ( item ) { return item.id === link.componentId; } )
                : null;
            var label = scenario ? scenarioDisplayName( scenario ) : link.scenarioId;
            if ( component ) {
                label += ' · ' + component.title;
            }
            return '<span class="pf2-session-content-badge">' + escapeHtml( label ) + '</span>';
        } ).join( '' );
        return '<div class="pf2-session-content"><div class="pf2-label">Campagne / mission</div><div class="pf2-session-content-badges">' + badges + '</div></div>';
    }

    function contentRowHtml( link ) {
        link = link || { scenarioId: '', componentId: null };
        var scenario = scenarioById( link.scenarioId );
        var hasComponents = scenario && Array.isArray( scenario.playableComponents ) && scenario.playableComponents.length > 0;
        return '<div class="pf2-session-content-row" data-content-row>' +
            '<label>Campagne / scénario<select data-content-scenario>' + scenarioOptions( link.scenarioId || '' ) + '</select></label>' +
            '<label>Composant<select data-content-component' + ( hasComponents ? '' : ' disabled' ) + '>' + componentOptions( link.scenarioId || '', link.componentId || '' ) + '</select></label>' +
            '<button class="pf2-button pf2-danger" type="button" data-content-remove>Retirer</button>' +
            '</div>';
    }

    function contentEditorHtml( session ) {
        var links = Array.isArray( session.content ) ? session.content : [];
        return '<fieldset class="pf2-session-content-editor">' +
            '<legend>Campagne / scénario joué</legend>' +
            '<p>Cette liaison alimente le journal MJ. Le bouton d’association est réservé aux administrateurs du wiki.</p>' +
            '<div data-content-rows>' + links.map( contentRowHtml ).join( '' ) + '</div>' +
            '<button class="pf2-button" type="button" data-content-add>+ Associer à une campagne</button>' +
            '</fieldset>';
    }

    function completeness( session ) {
        var missing = [];
        if ( !session.date ) { missing.push( 'date réelle' ); }
        if ( !session.inGameStartDate ) { missing.push( 'début en jeu' ); }
        if ( !session.inGameEndDate ) { missing.push( 'fin en jeu' ); }
        if ( !session.title ) { missing.push( 'titre' ); }
        if ( !session.participants || !session.participants.length ) { missing.push( 'participants' ); }
        if ( !session.shortSummary ) { missing.push( 'résumé court' ); }
        if ( !session.shortSummaryAuthor ) { missing.push( 'auteur résumé court' ); }
        return missing;
    }

    function sessionHtml( session ) {
        var participants = ( session.participantNames || [] ).map( escapeHtml ).join( ' · ' );
        var missing = completeness( session );
        var isPublished = session.published === true ||
            session.published === 1 ||
            session.published === '1';

        var status = isPublished
            ? '<span class="pf2-status pf2-status-published">Publié</span>'
            : '<span class="pf2-status pf2-status-draft">Brouillon</span>';
        var completenessBadge = missing.length
            ? '<span class="pf2-status pf2-status-warning">' + missing.length + ' champ' + ( missing.length > 1 ? 's' : '' ) + ' à renseigner</span>'
            : '<span class="pf2-status pf2-status-complete">Complet</span>';
        var contributorButtons = state.canContribute
            ? '<button class="pf2-button pf2-primary" data-edit>Modifier</button>' +
              '<button class="pf2-button" data-publication="' + ( isPublished ? '0' : '1' ) + '">' +
              ( isPublished ? 'Remettre en brouillon' : 'Publier' ) + '</button>'
            : '';
        var adminButtons = state.canAdmin
            ? '<button class="pf2-button pf2-danger" data-delete>Supprimer</button>'
            : '';

        return '<article id="pf2-session-' + escapeHtml( session.sessionNumber ) + '" class="pf2-session" data-session-id="' + escapeHtml( session.id ) + '">' +
            '<div class="pf2-session-top"><div>' +
            '<div class="pf2-session-kicker">Séance ' + escapeHtml( session.sessionNumber ) + ' · ' + escapeHtml( formatDate( session.date ) ) + '</div>' +
            '<h2 class="pf2-session-title">' + escapeHtml( session.title || ( 'Séance ' + session.sessionNumber ) ) + '</h2>' +
            '</div><div class="pf2-badges">' + status + completenessBadge + '</div></div>' +
            '<div class="pf2-session-meta">' + ( participants || '<span class="pf2-missing">Participants non renseignés</span>' ) + '</div>' +
            '<div class="pf2-session-meta">En jeu : ' + displayValue( session.inGameStartDate ) +
                ( session.inGameEndDate ? ' → ' + escapeHtml( session.inGameEndDate ) : ' → <span class="pf2-missing">Non renseigné</span>' ) + '</div>' +
            sessionContentHtml( session ) +
            '<dl class="pf2-session-facts">' +
              '<div><dt>XP séance</dt><dd>' + escapeHtml( session.sessionXp ) + '</dd></div>' +
              '<div><dt>Auteur résumé court</dt><dd>' + displayValue( session.shortSummaryAuthorName ) + '</dd></div>' +
              '<div><dt>Niveau début — résumé court</dt><dd>' + escapeHtml( summaryRewardText( session.shortSummaryLevelAtStart, session.shortSummaryXp ) ) + '</dd></div>' +
              '<div><dt>Auteur résumé long</dt><dd>' + displayValue( session.longSummaryAuthorName ) + '</dd></div>' +
              '<div><dt>Niveau début — résumé long</dt><dd>' + escapeHtml( summaryRewardText( session.longSummaryLevelAtStart, session.longSummaryXp ) ) + '</dd></div>' +
            '</dl>' +
            '<div class="pf2-session-summary"><div class="pf2-label">Résumé court</div>' +
              ( session.shortSummary ? escapeHtml( session.shortSummary ).replace( /\n/g, '<br>' ) : '<span class="pf2-missing">Non renseigné</span>' ) +
            '</div>' +
            '<div class="pf2-session-actions">' + contributorButtons + adminButtons + '</div>' +
            '</article>';
    }

    function editorHtml( session ) {
        var participantChecks = state.actors.map( function ( actor ) {
            var checked = ( session.participants || [] ).indexOf( actor.uuid ) !== -1 ? ' checked' : '';
            return '<label class="pf2-participant"><input type="checkbox" data-participant value="' + escapeHtml( actor.uuid ) + '"' + checked + '> ' + escapeHtml( actor.name ) + '</label>';
        } ).join( '' );

        return '<form class="pf2-editor" data-editor>' +
            '<div class="pf2-editor-grid">' +
              '<label>Numéro de séance<input name="sessionNumber" type="number" min="1" step="1" required value="' + escapeHtml( session.sessionNumber ) + '"></label>' +
              '<label>Date réelle<input name="date" type="date" value="' + escapeHtml( session.date || '' ) + '"></label>' +
              '<label class="pf2-span-2">Titre<input name="title" type="text" value="' + escapeHtml( session.title || '' ) + '"></label>' +
              '<label>Date en jeu — début<input name="inGameStartDate" type="date" value="' + escapeHtml( session.inGameStartDate || '' ) + '"></label>' +
              '<label>Date en jeu — fin<input name="inGameEndDate" type="date" value="' + escapeHtml( session.inGameEndDate || '' ) + '"></label>' +
              '<label>XP séance<input name="sessionXp" type="number" min="0" step="1" value="' + escapeHtml( session.sessionXp ) + '"></label>' +
              '<label>Auteur résumé court<select name="shortSummaryAuthor">' + selectOptions( session.shortSummaryAuthor, true ) + '</select></label>' +
              '<label>Niveau du personnage au début de la séance — résumé court<input data-short-summary-level type="text" readonly value="' + escapeHtml( summaryRewardText( session.shortSummaryLevelAtStart, session.shortSummaryXp ) ) + '"></label>' +
              '<label>Auteur résumé long<select name="longSummaryAuthor">' + selectOptions( session.longSummaryAuthor, true ) + '</select></label>' +
              '<label>Niveau du personnage au début de la séance — résumé long<input data-long-summary-level type="text" readonly value="' + escapeHtml( summaryRewardText( session.longSummaryLevelAtStart, session.longSummaryXp ) ) + '"></label>' +
            '</div>' +
            ( state.canAdmin ? contentEditorHtml( session ) : '' ) +
            '<fieldset class="pf2-participants"><legend>Participants</legend><div class="pf2-participant-grid">' + participantChecks + '</div></fieldset>' +
            '<label class="pf2-summary-editor">Résumé court<textarea name="shortSummary" maxlength="1550" rows="12">' + escapeHtml( session.shortSummary || '' ) + '</textarea><small><span data-count>' + escapeHtml( ( session.shortSummary || '' ).length ) + '</span>/1550</small></label>' +
            '<div class="pf2-editor-actions"><button class="pf2-button pf2-primary" type="submit">Enregistrer</button><button class="pf2-button" type="button" data-cancel>Annuler</button></div>' +
        '</form>';
    }

    function bindCard( article, session ) {
        addLongSummaryLink( article, session );

        var edit = article.querySelector( '[data-edit]' );
        if ( edit ) {
            edit.addEventListener( 'click', function () {
                article.innerHTML = editorHtml( session );
                bindEditor( article, session );
            } );
        }
        var publication = article.querySelector( '[data-publication]' );
        if ( publication ) {
            publication.addEventListener( 'click', function () {
                setPublication( session.id, publication.dataset.publication === '1' );
            } );
        }
        var remove = article.querySelector( '[data-delete]' );
        if ( remove ) {
            remove.addEventListener( 'click', function () {
                deleteSession( session.id );
            } );
        }
    }

    function bindContentRow( row ) {
        var scenarioSelect = row.querySelector( '[data-content-scenario]' );
        var componentSelect = row.querySelector( '[data-content-component]' );
        var remove = row.querySelector( '[data-content-remove]' );

        scenarioSelect.addEventListener( 'change', function () {
            var scenario = scenarioById( scenarioSelect.value );
            var hasComponents = scenario && Array.isArray( scenario.playableComponents ) && scenario.playableComponents.length > 0;
            componentSelect.innerHTML = componentOptions( scenarioSelect.value, '' );
            componentSelect.disabled = !hasComponents;
        } );

        remove.addEventListener( 'click', function () {
            row.remove();
        } );
    }

    function bindEditor( article, session ) {
        var form = article.querySelector( '[data-editor]' );
        var textarea = form.querySelector( 'textarea[name="shortSummary"]' );
        var count = form.querySelector( '[data-count]' );
        var contentRows = form.querySelector( '[data-content-rows]' );
        var addContent = form.querySelector( '[data-content-add]' );
        var shortAuthor = form.querySelector( 'select[name="shortSummaryAuthor"]' );
        var longAuthor = form.querySelector( 'select[name="longSummaryAuthor"]' );
        var shortLevel = form.querySelector( '[data-short-summary-level]' );
        var longLevel = form.querySelector( '[data-long-summary-level]' );

        textarea.addEventListener( 'input', function () { count.textContent = textarea.value.length; } );
        shortAuthor.addEventListener( 'change', function () {
            if ( shortAuthor.value !== ( session.shortSummaryAuthor || '' ) ) {
                shortLevel.value = shortAuthor.value ? 'Calculé à l’enregistrement' : '—';
            } else {
                shortLevel.value = summaryRewardText( session.shortSummaryLevelAtStart, session.shortSummaryXp );
            }
        } );
        longAuthor.addEventListener( 'change', function () {
            if ( longAuthor.value !== ( session.longSummaryAuthor || '' ) ) {
                longLevel.value = longAuthor.value ? 'Calculé à l’enregistrement' : '—';
            } else {
                longLevel.value = summaryRewardText( session.longSummaryLevelAtStart, session.longSummaryXp );
            }
        } );
        form.querySelector( '[data-cancel]' ).addEventListener( 'click', load );
        if ( contentRows && addContent ) {
            form.querySelectorAll( '[data-content-row]' ).forEach( bindContentRow );
            addContent.addEventListener( 'click', function () {
                var wrapper = document.createElement( 'div' );
                wrapper.innerHTML = contentRowHtml( null );
                var row = wrapper.firstElementChild;
                contentRows.appendChild( row );
                bindContentRow( row );
            } );
        }

        form.addEventListener( 'submit', function ( event ) {
            event.preventDefault();
            var data = new FormData( form );
            var payload = {
                sessionNumber: Number( data.get( 'sessionNumber' ) ),
                date: String( data.get( 'date' ) || '' ),
                title: String( data.get( 'title' ) || '' ),
                inGameStartDate: String( data.get( 'inGameStartDate' ) || '' ),
                inGameEndDate: String( data.get( 'inGameEndDate' ) || '' ),
                sessionXp: Number( data.get( 'sessionXp' ) || 0 ),
                shortSummaryAuthor: String( data.get( 'shortSummaryAuthor' ) || '' ) || null,
                longSummaryAuthor: String( data.get( 'longSummaryAuthor' ) || '' ) || null,
                shortSummary: String( data.get( 'shortSummary' ) || '' ).trim(),
                participants: Array.from( form.querySelectorAll( '[data-participant]:checked' ) ).map( function ( item ) { return item.value; } )
            };
            if ( state.canAdmin ) {
                payload.content = Array.from( form.querySelectorAll( '[data-content-row]' ) ).map( function ( row ) {
                    var scenarioId = row.querySelector( '[data-content-scenario]' ).value;
                    var componentId = row.querySelector( '[data-content-component]' ).value;
                    return scenarioId ? {
                        scenarioId: scenarioId,
                        componentId: componentId || null
                    } : null;
                } ).filter( Boolean );
            }
            saveSession( session.id, payload, form );
        } );
    }

    function render() {
        state.sessions.sort( function ( a, b ) { return Number( a.sessionNumber ) - Number( b.sessionNumber ); } );
        root.innerHTML = state.sessions.map( sessionHtml ).join( '' );
        root.querySelectorAll( '.pf2-session' ).forEach( function ( article ) {
            var session = state.sessions.find( function ( item ) { return item.id === article.dataset.sessionId; } );
            if ( session ) { bindCard( article, session ); }
        } );
        refreshLongSummaryLinks();
    }

    function saveSession( id, payload, form ) {
        form.classList.add( 'pf2-saving' );
        api.postWithToken( 'csrf', {
            action: 'pf2sessionupdate',
            format: 'json',
            id: id,
            payload: JSON.stringify( payload )
        } ).then( function ( response ) {
            var result = response && response.pf2 ? response.pf2 : {};
            var discord = result.discord || {};
            if ( discord.status === 'failed' ) {
                mw.notify( 'Séance enregistrée en base, mais Discord n’a pas été synchronisé : ' + ( discord.reason || 'raison inconnue' ), { type: 'warn' } );
            } else {
                mw.notify( 'Séance enregistrée.', { type: 'success' } );
            }
            return load();
        } ).catch( function ( error ) {
            mw.notify( 'Impossible d’enregistrer la séance : ' + error, { type: 'error' } );
            form.classList.remove( 'pf2-saving' );
        } );
    }

    function setPublication( id, published ) {
        var label = published ? 'Publier cette séance ?' : 'Remettre cette séance en brouillon ?';
        if ( !window.confirm( label ) ) { return; }
        api.postWithToken( 'csrf', {
            action: 'pf2sessionpublication',
            format: 'json',
            id: id,
            published: published ? '1' : '0'
        } ).then( function () {
            mw.notify( published ? 'Séance publiée.' : 'Séance remise en brouillon.', { type: 'success' } );
            return load();
        } ).catch( function ( error ) {
            mw.notify( 'Impossible de modifier la publication : ' + error, { type: 'error' } );
        } );
    }

    function deleteSession( id ) {
        if ( !window.confirm( 'Supprimer définitivement cette séance de la base SQLite ?' ) ) { return; }
        api.postWithToken( 'csrf', {
            action: 'pf2sessiondelete',
            format: 'json',
            id: id
        } ).then( function () {
            mw.notify( 'Séance supprimée.', { type: 'success' } );
            return load();
        } ).catch( function ( error ) {
            mw.notify( 'Impossible de supprimer la séance : ' + error, { type: 'error' } );
        } );
    }

    function load() {
        root.classList.add( 'pf2-loading' );
        return api.get( { action: 'pf2sessions', format: 'json' } ).then( function ( data ) {
            var payload = data.pf2sessions || {};
            state.sessions = payload.sessions || [];
            state.actors = payload.actors || [];
            state.scenarios = payload.scenarios || [];
            state.canContribute = payload.canContribute === true ||
                payload.canContribute === 1 ||
                payload.canContribute === '1';
            state.canAdmin = payload.canAdmin === true ||
                payload.canAdmin === 1 ||
                payload.canAdmin === '1';
            render();
        } ).catch( function () {
            root.innerHTML = '<div class="errorbox">Impossible de charger les séances.</div>';
        } ).then( function () {
            root.classList.remove( 'pf2-loading' );
        }, function () {
            root.classList.remove( 'pf2-loading' );
        } );
    }

    load();
}() );
