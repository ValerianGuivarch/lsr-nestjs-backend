( function () {
	'use strict';

	function pageTitle() { return mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ); }
	function api() { return new mw.Api(); }
	function request( op, id, target, payload ) { return api().postWithToken( 'csrf', { action: 'pf2playercodexupdate', op: op, id: id || '', target: target || '', payload: JSON.stringify( payload ), format: 'json' } ); }
	function link( page, text ) { var a = document.createElement( 'a' ); a.href = mw.util.getUrl( page ); a.textContent = text; return a; }
	function heading( value ) { var h = document.createElement( 'h2' ); h.textContent = value; return h; }
	function errorMessage( error, fallback ) { return ( error && error.error && ( error.error.info || error.error.code ) ) || ( error && error.message ) || fallback; }
	function imageForFilename( filename ) { return filename ? mw.util.getUrl( 'Special:FilePath/' + filename ) : ''; }

	function factionDepth( faction, factions ) {
		var byId = new Map( factions.map( function ( item ) { return [ item.id, item ]; } ) );
		var depth = 0; var parent = faction.parentFactionId; var seen = new Set();
		while ( parent && !seen.has( parent ) && byId.has( parent ) ) { seen.add( parent ); depth += 1; parent = byId.get( parent ).parentFactionId; }
		return depth;
	}
	function factionLabel( faction, factions ) { return Array( factionDepth( faction, factions ) + 1 ).join( '— ' ) + faction.name; }
	function sortedFactions( factions ) {
		var byId = new Map( factions.map( function ( item ) { return [ item.id, item ]; } ) );
		function path( faction ) {
			var labels = [ faction.name ]; var parent = faction.parentFactionId; var seen = new Set( [ faction.id ] );
			while ( parent && !seen.has( parent ) && byId.has( parent ) ) { seen.add( parent ); var current = byId.get( parent ); labels.unshift( current.name ); parent = current.parentFactionId; }
			return labels.join( ' › ' );
		}
		return factions.slice().sort( function ( a, b ) { return path( a ).localeCompare( path( b ), 'fr' ); } );
	}
	function addFactionOptions( select, factions, allLabel, hierarchy ) {
		var source = hierarchy || factions;
		if ( allLabel ) { var all = document.createElement( 'option' ); all.value = ''; all.textContent = allLabel; select.appendChild( all ); }
		sortedFactions( source ).filter( function ( item ) { return factions.some( function ( faction ) { return faction.id === item.id; } ); } ).forEach( function ( faction ) { var option = document.createElement( 'option' ); option.value = faction.id; option.textContent = factionLabel( faction, source ); select.appendChild( option ); } );
	}

	function kindBadge( character ) {
		var badge = document.createElement( 'span' );
		badge.className = 'pf2-player-kind ' + ( character.isPlayer ? 'player' : 'npc' );
		badge.textContent = character.isPlayer ? 'PJ' : 'PNJ';
		return badge;
	}

	function characterCard( character ) {
		var card = document.createElement( 'article' ); card.className = 'pf2-player-card';
		if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.src = imageForFilename( character.wikiPortraitFilename ); image.alt = ''; card.appendChild( image ); }
		var titleRow = document.createElement( 'div' ); titleRow.className = 'pf2-player-card-title'; titleRow.appendChild( link( character.wikiPageTitle, character.displayName ) ); titleRow.appendChild( kindBadge( character ) ); card.appendChild( titleRow );
		var factions = document.createElement( 'p' ); factions.textContent = character.factions.length ? 'Factions : ' + character.factions.map( function ( f ) { return f.name; } ).join( ', ' ) : 'Aucune faction connue.'; card.appendChild( factions );
		return card;
	}

	function listPage( data, root ) {
		root.appendChild( heading( 'Personnages connus' ) );
		var controls = document.createElement( 'div' ); controls.className = 'pf2-player-filters';
		var search = document.createElement( 'input' ); search.type = 'search'; search.placeholder = 'Rechercher un personnage'; search.setAttribute( 'aria-label', 'Rechercher un personnage' ); controls.appendChild( search );
		var kind = document.createElement( 'select' );
		[ [ 'all', 'Tous' ], [ 'player', 'PJ' ], [ 'npc', 'PNJ' ] ].forEach( function ( pair ) { var option = document.createElement( 'option' ); option.value = pair[ 0 ]; option.textContent = pair[ 1 ]; kind.appendChild( option ); } );
		controls.appendChild( kind );
		var faction = document.createElement( 'select' ); addFactionOptions( faction, data.factions, 'Toutes les factions' ); controls.appendChild( faction );
		root.appendChild( controls );
		var list = document.createElement( 'div' ); list.className = 'pf2-player-list'; root.appendChild( list );
		function draw() {
			var term = search.value.trim().toLocaleLowerCase(); list.textContent = '';
			data.characters.filter( function ( c ) {
				if ( term && c.displayName.toLocaleLowerCase().indexOf( term ) === -1 ) { return false; }
				if ( kind.value === 'player' && !( c.isPlayer === true || c.isPlayer === 1 ) ) { return false; }
				if ( kind.value === 'npc' && ( c.isPlayer === true || c.isPlayer === 1 ) ) { return false; }
				if ( faction.value && !c.factions.some( function ( current ) { return current.id === faction.value; } ) ) { return false; }
				return true;
			} ).forEach( function ( c ) { list.appendChild( characterCard( c ) ); } );
		}
		search.addEventListener( 'input', draw ); kind.addEventListener( 'change', draw ); faction.addEventListener( 'change', draw ); draw();
	}

	function characterPage( data, root, character ) {
		var titleNode = document.querySelector( '.mw-page-title-main' ) || document.querySelector( '#firstHeading' );
		if ( titleNode ) { titleNode.textContent = character.displayName; }
		document.title = character.displayName + ' — ' + mw.config.get( 'wgSiteName' );
		root.classList.add( 'pf2-player-character-page' );
		var layout = document.createElement( 'div' ); layout.className = 'pf2-player-character-layout';
		var portraitColumn = document.createElement( 'aside' ); portraitColumn.className = 'pf2-player-character-side';
		if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.className = 'pf2-player-character-portrait'; image.src = imageForFilename( character.wikiPortraitFilename ); image.alt = character.displayName || ''; portraitColumn.appendChild( image ); }
		portraitColumn.appendChild( kindBadge( character ) );
		if ( data.canEdit ) { var removeCharacter = document.createElement( 'button' ); removeCharacter.textContent = 'Supprimer ce personnage'; removeCharacter.onclick = function () { if ( window.confirm( 'Supprimer cette fiche du carnet joueur ? Le PNJ MJ et la page wiki seront conservés.' ) ) { request( 'deleteCharacter', character.npcId, '', {} ).then( function () { window.location.assign( mw.util.getUrl( 'Personnages' ) ); } ).catch( function ( error ) { mw.notify( errorMessage( error, 'Suppression impossible' ), { type: 'error' } ); } ); } }; portraitColumn.appendChild( removeCharacter ); }
		layout.appendChild( portraitColumn );
		var main = document.createElement( 'div' ); main.className = 'pf2-player-character-main';
		main.appendChild( heading( 'Factions connues' ) );
		var factionList = document.createElement( 'ul' ); factionList.className = 'pf2-player-character-factions'; main.appendChild( factionList );
		character.factions.forEach( function ( known ) { var item = document.createElement( 'li' ); item.appendChild( link( known.wikiPageTitle, known.name ) ); if ( data.canEdit ) { var remove = document.createElement( 'button' ); remove.textContent = 'Retirer'; remove.onclick = function () { request( 'removeFaction', character.npcId, known.id, {} ).then( function () { window.location.reload(); } ).catch( function ( error ) { mw.notify( errorMessage( error, 'Retrait impossible' ), { type: 'error' } ); } ); }; item.appendChild( remove ); } factionList.appendChild( item ); } );
		if ( data.canEdit ) {
			var row = document.createElement( 'div' ); row.className = 'pf2-player-faction-add';
			var select = document.createElement( 'select' ); var available = data.factions.filter( function ( f ) { return !character.factions.some( function ( current ) { return current.id === f.id; } ); } ); addFactionOptions( select, available, null, data.factions ); row.appendChild( select );
			var add = document.createElement( 'button' ); add.textContent = 'Ajouter une faction'; add.onclick = function () { if ( select.value ) { request( 'addFaction', character.npcId, select.value, {} ).then( function () { window.location.reload(); } ).catch( function ( error ) { mw.notify( errorMessage( error, 'Ajout impossible' ), { type: 'error' } ); } ); } }; row.appendChild( add ); main.appendChild( row );
		}
		var wikiContent = document.createElement( 'div' ); wikiContent.className = 'pf2-player-wiki-content';
		while ( root.nextSibling ) { wikiContent.appendChild( root.nextSibling ); }
		main.appendChild( wikiContent ); layout.appendChild( main ); root.appendChild( layout );
	}

	function factionsPage( data, root ) {
		root.appendChild( heading( 'Factions' ) ); var note = document.createElement( 'p' ); note.textContent = 'Les factions sont publiées depuis l’interface MJ.'; root.appendChild( note );
		var list = document.createElement( 'ul' ); sortedFactions( data.factions ).forEach( function ( faction ) { var item = document.createElement( 'li' ); item.appendChild( link( faction.wikiPageTitle, factionLabel( faction, data.factions ) ) ); list.appendChild( item ); } ); root.appendChild( list );
	}

	function renderParsedText( target, text ) {
		target.textContent = '';
		if ( !text || !text.trim() ) { var empty = document.createElement( 'p' ); empty.className = 'pf2-player-empty'; empty.textContent = 'Aucun contenu pour le moment.'; target.appendChild( empty ); return Promise.resolve(); }
		return api().post( { action: 'parse', text: text, contentmodel: 'wikitext', prop: 'text', formatversion: 2, format: 'json' } ).then( function ( response ) {
			target.innerHTML = response && response.parse && response.parse.text ? response.parse.text : '';
		} ).catch( function () { target.textContent = text; } );
	}

	function renderWikiPage( target, title ) {
		target.textContent = 'Chargement de la fiche…';
		return api().get( { action: 'parse', page: title, prop: 'text', formatversion: 2, format: 'json' } ).then( function ( response ) {
			target.innerHTML = response && response.parse && response.parse.text ? response.parse.text : '';
		} ).catch( function () {
			target.textContent = '';
			var p = document.createElement( 'p' ); p.textContent = 'La fiche Wiki n’a pas pu être chargée ici. '; p.appendChild( link( title, 'Voir la fiche' ) ); target.appendChild( p );
		} );
	}

	function contactCard( contact ) {
		var card = document.createElement( 'article' ); card.className = 'pf2-player-card pf2-player-contact-card';
		var src = contact.wikiPortraitFilename ? imageForFilename( contact.wikiPortraitFilename ) : contact.portraitUrl;
		if ( src ) { var image = document.createElement( 'img' ); image.src = src; image.alt = ''; card.appendChild( image ); }
		var title = document.createElement( 'strong' ); title.textContent = contact.displayName; card.appendChild( title );
		if ( !contact.published ) { var badge = document.createElement( 'span' ); badge.className = 'pf2-player-kind private'; badge.textContent = 'Contact privé'; card.appendChild( badge ); }
		if ( contact.role ) { var role = document.createElement( 'p' ); role.className = 'pf2-player-role'; role.textContent = contact.role; card.appendChild( role ); }
		if ( contact.description ) { var description = document.createElement( 'p' ); description.textContent = contact.description; card.appendChild( description ); }
		if ( contact.published && contact.wikiPageTitle ) { card.appendChild( link( contact.wikiPageTitle, 'Voir la fiche' ) ); }
		return card;
	}

	function myCharactersPage( data, root ) {
		root.appendChild( heading( 'Mes personnages' ) );
		var intro = document.createElement( 'p' ); intro.textContent = 'Cet espace est personnel : il rassemble vos PJ, leur background et leurs contacts privés.'; root.appendChild( intro );
		if ( !data.registered ) { var login = document.createElement( 'p' ); login.textContent = 'Vous devez être connecté pour voir vos personnages.'; root.appendChild( login ); return; }
		if ( !data.characters.length ) { var empty = document.createElement( 'p' ); empty.className = 'pf2-player-empty'; empty.textContent = 'Aucun personnage ne vous est encore associé. Un administrateur peut le faire avec /wiki-admin associer-personnage.'; root.appendChild( empty ); return; }

		var list = document.createElement( 'div' ); list.className = 'pf2-player-list pf2-my-character-list'; root.appendChild( list );
		var detail = document.createElement( 'section' ); detail.className = 'pf2-my-character-detail'; root.appendChild( detail );

		function openCharacter( character ) {
			detail.textContent = '';
			var header = document.createElement( 'div' ); header.className = 'pf2-my-character-header';
			var title = document.createElement( 'h2' ); title.textContent = character.displayName; header.appendChild( title );
			if ( character.wikiPageTitle ) { header.appendChild( link( character.wikiPageTitle, 'Voir la fiche publique' ) ); }
			detail.appendChild( header );
			var tabs = document.createElement( 'div' ); tabs.className = 'pf2-player-tabs'; detail.appendChild( tabs );
			var panel = document.createElement( 'div' ); panel.className = 'pf2-player-tab-panel'; detail.appendChild( panel );

			function showTab( name ) {
				Array.prototype.forEach.call( tabs.querySelectorAll( 'button' ), function ( button ) { button.classList.toggle( 'active', button.dataset.tab === name ); } );
				panel.textContent = '';
				if ( name === 'fiche' ) {
					var layout = document.createElement( 'div' ); layout.className = 'pf2-player-character-layout';
					var side = document.createElement( 'aside' ); side.className = 'pf2-player-character-side';
					if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.className = 'pf2-player-character-portrait'; image.src = imageForFilename( character.wikiPortraitFilename ); image.alt = character.displayName; side.appendChild( image ); }
					layout.appendChild( side );
					var content = document.createElement( 'div' ); content.className = 'pf2-player-wiki-content'; layout.appendChild( content ); panel.appendChild( layout ); renderWikiPage( content, character.wikiPageTitle );
				} else if ( name === 'background' ) {
					var actions = document.createElement( 'div' ); actions.className = 'pf2-player-background-actions'; panel.appendChild( actions );
					var view = document.createElement( 'div' ); view.className = 'pf2-player-background-view'; panel.appendChild( view );
					var edit = document.createElement( 'button' ); edit.textContent = 'Modifier le background'; actions.appendChild( edit );
					renderParsedText( view, character.background || '' );
					edit.onclick = function () {
						actions.textContent = ''; view.textContent = '';
						var textarea = document.createElement( 'textarea' ); textarea.className = 'pf2-player-background-editor'; textarea.value = character.background || ''; textarea.rows = 18; view.appendChild( textarea );
						var save = document.createElement( 'button' ); save.textContent = 'Enregistrer'; save.className = 'pf2-player-primary';
						var cancel = document.createElement( 'button' ); cancel.textContent = 'Annuler';
						actions.appendChild( save ); actions.appendChild( cancel );
						cancel.onclick = function () { showTab( 'background' ); };
						save.onclick = function () {
							save.disabled = true;
							api().postWithToken( 'csrf', { action: 'pf2playercodexmeupdate', npcId: character.npcId, content: textarea.value, format: 'json' } ).then( function () {
								character.background = textarea.value; mw.notify( 'Background enregistré.', { type: 'success' } ); showTab( 'background' );
							} ).catch( function ( error ) { save.disabled = false; mw.notify( errorMessage( error, 'Enregistrement impossible' ), { type: 'error' } ); } );
						};
					};
				} else if ( name === 'contacts' ) {
					if ( !character.contacts || !character.contacts.length ) { var noContact = document.createElement( 'p' ); noContact.className = 'pf2-player-empty'; noContact.textContent = 'Aucun contact privé pour ce personnage.'; panel.appendChild( noContact ); return; }
					var contacts = document.createElement( 'div' ); contacts.className = 'pf2-player-list'; character.contacts.forEach( function ( contact ) { contacts.appendChild( contactCard( contact ) ); } ); panel.appendChild( contacts );
				}
			}

			[ [ 'fiche', 'Fiche' ], [ 'background', 'Background' ], [ 'contacts', 'Contacts' ] ].forEach( function ( item ) { var button = document.createElement( 'button' ); button.dataset.tab = item[ 0 ]; button.textContent = item[ 1 ]; button.onclick = function () { showTab( item[ 0 ] ); }; tabs.appendChild( button ); } );
			showTab( 'fiche' );
			detail.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}

		data.characters.forEach( function ( character ) {
			var card = document.createElement( 'article' ); card.className = 'pf2-player-card pf2-my-character-card';
			if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.src = imageForFilename( character.wikiPortraitFilename ); image.alt = ''; card.appendChild( image ); }
			var title = document.createElement( 'strong' ); title.textContent = character.displayName; card.appendChild( title );
			var open = document.createElement( 'button' ); open.textContent = 'Ouvrir'; open.onclick = function () { openCharacter( character ); }; card.appendChild( open );
			list.appendChild( card );
		} );
	}

	$( function () {
		var username = mw.config.get( 'wgUserName' );
		if ( username && !document.getElementById( 'n-pf2-my-characters' ) ) {
			mw.util.addPortletLink( 'p-navigation', mw.util.getUrl( 'Mes personnages' ), 'Mes personnages', 'n-pf2-my-characters' );
		}

		var page = pageTitle(); var content = document.querySelector( '#mw-content-text' );
		var isMine = page === 'Mes personnages' || page === 'Mes perso';
		var isCodex = page === 'Personnages' || page === 'PJs' || page === 'Factions' || page.indexOf( 'Personnage:' ) === 0 || page.indexOf( 'Faction:' ) === 0;
		if ( !content || ( !isMine && !isCodex ) ) { return; }
		if ( isMine ) { content.textContent = ''; }
		var root = document.createElement( 'section' ); root.id = 'pf2-player-codex'; content.insertBefore( root, content.firstChild );

		if ( isMine ) {
			api().get( { action: 'pf2playercodexme', format: 'json' } ).then( function ( response ) { myCharactersPage( response.pf2playercodexme, root ); } ).catch( function ( error ) { root.textContent = errorMessage( error, 'Impossible de charger vos personnages.' ); } );
			return;
		}

		api().get( { action: 'pf2playercodex', format: 'json' } ).then( function ( response ) {
			var data = response.pf2playercodex;
			if ( page === 'Personnages' || page === 'PJs' ) { listPage( data, root ); }
			else if ( page === 'Factions' ) { factionsPage( data, root ); }
			else if ( page.indexOf( 'Personnage:' ) === 0 ) { var character = data.characters.filter( function ( item ) { return item.wikiPageTitle === page; } )[0]; if ( character ) { characterPage( data, root, character ); } }
			else { root.remove(); }
		} );
	} );
}() );
