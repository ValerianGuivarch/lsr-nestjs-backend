( function () {
	'use strict';
	function pageTitle() { return mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ); }
	function api() { return new mw.Api(); }
	function request( op, id, target, payload ) { return api().postWithToken( 'csrf', { action: 'pf2playercodexupdate', op: op, id: id || '', target: target || '', payload: JSON.stringify( payload ), format: 'json' } ); }
	function link( page, text ) { var a = document.createElement( 'a' ); a.href = mw.util.getUrl( page ); a.textContent = text; return a; }
	function heading( value ) { var h = document.createElement( 'h2' ); h.textContent = value; return h; }
	function errorMessage( error, fallback ) { return ( error && error.error && ( error.error.info || error.error.code ) ) || ( error && error.message ) || fallback; }
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
	function characterCard( character ) {
		var card = document.createElement( 'article' ); card.className = 'pf2-player-card';
		if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.src = mw.util.getUrl( 'Special:FilePath/' + character.wikiPortraitFilename ); image.alt = ''; card.appendChild( image ); }
		card.appendChild( link( character.wikiPageTitle, character.displayName ) );
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
		if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.className = 'pf2-player-character-portrait'; image.src = mw.util.getUrl( 'Special:FilePath/' + character.wikiPortraitFilename ); image.alt = character.displayName || ''; portraitColumn.appendChild( image ); }
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
	$( function () {
		var page = pageTitle(); var content = document.querySelector( '#mw-content-text' );
		if ( !content || ( page !== 'Personnages' && page !== 'PJs' && page !== 'Factions' && page.indexOf( 'Personnage:' ) !== 0 && page.indexOf( 'Faction:' ) !== 0 ) ) { return; }
		var root = document.createElement( 'section' ); root.id = 'pf2-player-codex'; content.insertBefore( root, content.firstChild );
		api().get( { action: 'pf2playercodex', format: 'json' } ).then( function ( response ) {
			var data = response.pf2playercodex;
			if ( page === 'Personnages' || page === 'PJs' ) { listPage( data, root ); }
			else if ( page === 'Factions' ) { factionsPage( data, root ); }
			else if ( page.indexOf( 'Personnage:' ) === 0 ) { var character = data.characters.filter( function ( item ) { return item.wikiPageTitle === page; } )[0]; if ( character ) { characterPage( data, root, character ); } }
			else { root.remove(); }
		} );
	} );
}() );
