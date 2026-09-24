( function () {
	'use strict';
	function pageTitle() { return mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ); }
	function api() { return new mw.Api(); }
	function request( op, id, target, payload ) { return api().postWithToken( 'csrf', { action: 'pf2playercodexupdate', op: op, id: id || '', target: target || '', payload: JSON.stringify( payload ), format: 'json' } ); }
	function link( page, text ) { var a = document.createElement( 'a' ); a.href = mw.util.getUrl( page ); a.textContent = text; return a; }
	function heading( value ) { var h = document.createElement( 'h2' ); h.textContent = value; return h; }
	function characterCard( character ) { var card = document.createElement( 'article' ); card.className = 'pf2-player-card'; if ( character.wikiPortraitFilename ) { var image = document.createElement( 'img' ); image.src = mw.util.getUrl( 'Special:FilePath/' + character.wikiPortraitFilename ); image.alt = ''; card.appendChild( image ); } card.appendChild( link( character.wikiPageTitle, character.displayName ) ); var factions = document.createElement( 'p' ); factions.textContent = character.factions.length ? 'Factions connues : ' + character.factions.map( function ( f ) { return f.name; } ).join( ', ' ) : 'Aucune faction connue.'; card.appendChild( factions ); return card; }
	function listPage( data, root ) { root.appendChild( heading( 'Personnages connus' ) ); var search = document.createElement( 'input' ); search.placeholder = 'Rechercher un personnage'; root.appendChild( search ); var list = document.createElement( 'div' ); list.className = 'pf2-player-list'; root.appendChild( list ); function draw() { list.textContent = ''; data.characters.filter( function ( c ) { return c.displayName.toLocaleLowerCase().indexOf( search.value.toLocaleLowerCase() ) !== -1; } ).forEach( function ( c ) { list.appendChild( characterCard( c ) ); } ); } search.addEventListener( 'input', draw ); draw(); }
	function characterPage( data, root, character ) {
        var pageTitle =
            document.querySelector( '.mw-page-title-main' ) ||
            document.querySelector( '#firstHeading' );

        if ( pageTitle ) {
            pageTitle.textContent = character.displayName;
        }

        document.title = character.displayName + ' — ' + mw.config.get( 'wgSiteName' );

        var header = document.createElement( 'div' );
        header.className = 'pf2-player-character-header';

        if ( character.wikiPortraitFilename ) {
            var image = document.createElement( 'img' );
            image.className = 'pf2-player-character-portrait';
            image.src = mw.util.getUrl( 'Special:FilePath/' + character.wikiPortraitFilename );
            image.alt = character.displayName || '';
            header.appendChild( image );
        }


        root.appendChild( header );
        if ( data.canEdit ) { var removeCharacter = document.createElement( 'button' ); removeCharacter.textContent = 'Supprimer ce personnage'; removeCharacter.onclick = function () { if ( window.confirm( 'Supprimer cette fiche du carnet joueur ? Le PNJ MJ et la page wiki seront conservés.' ) ) { request( 'deleteCharacter', character.npcId, '', {} ).then( function () { window.location.assign( mw.util.getUrl( 'Personnages' ) ); } ).catch( function ( error ) { mw.notify( errorMessage( error, 'Suppression impossible' ), { type: 'error' } ); } ); } }; root.appendChild( removeCharacter ); }
        root.appendChild( heading( 'Factions connues' ) ); var list = document.createElement( 'ul' ); root.appendChild( list ); character.factions.forEach( function ( faction ) { var item = document.createElement( 'li' ); item.appendChild( link( faction.wikiPageTitle, faction.name ) ); if ( data.canEdit ) { var remove = document.createElement( 'button' ); remove.textContent = 'Retirer'; remove.onclick = function () { request( 'removeFaction', character.npcId, faction.id, {} ).then( function () { window.location.reload(); } ); }; item.appendChild( remove ); } list.appendChild( item ); } ); if ( data.canEdit ) { var select = document.createElement( 'select' ); data.factions.filter( function ( f ) { return !character.factions.some( function ( current ) { return current.id === f.id; } ); } ).forEach( function ( f ) { var option = document.createElement( 'option' ); option.value = f.id; option.textContent = f.name; select.appendChild( option ); } ); var add = document.createElement( 'button' ); add.textContent = 'Ajouter une faction'; add.onclick = function () { if ( select.value ) { request( 'addFaction', character.npcId, '', { factionId: select.value } ).then( function () { window.location.reload(); } ); } }; root.appendChild( select ); root.appendChild( add ); } }
	function errorMessage( error, fallback ) { return ( error && error.error && ( error.error.info || error.error.code ) ) || ( error && error.message ) || fallback; }
	function factionsPage( data, root ) { root.appendChild( heading( 'Factions' ) ); var note = document.createElement( 'p' ); note.textContent = 'Les factions sont publiées depuis l’interface MJ.'; root.appendChild( note ); var list = document.createElement( 'ul' ); data.factions.forEach( function ( f ) { var item = document.createElement( 'li' ); item.appendChild( link( f.wikiPageTitle, f.name ) ); list.appendChild( item ); } ); root.appendChild( list ); }
	function factionPage( data, root, faction ) { root.appendChild( heading( 'Organisation connue' ) ); var description = document.createElement( 'p' ); description.textContent = faction.description || ''; root.appendChild( description ); var text = document.createElement( 'p' ); text.textContent = faction.parentFactionId ? 'Sous-faction de : ' + ( data.factions.filter( function ( f ) { return f.id === faction.parentFactionId; } )[0] || {} ).name : 'Aucune faction parente'; root.appendChild( text ); }
	$( function () { var page = pageTitle(); var content = document.querySelector( '#mw-content-text' ); if ( !content || ( page !== 'Personnages' && page !== 'PJs' && page !== 'Factions' && page.indexOf( 'Personnage:' ) !== 0 && page.indexOf( 'Faction:' ) !== 0 ) ) { return; } var root = document.createElement( 'section' ); root.id = 'pf2-player-codex'; content.insertBefore( root, content.firstChild ); api().get( { action: 'pf2playercodex', format: 'json' } ).then( function ( response ) { var data = response.pf2playercodex; if ( page === 'Personnages' ) { listPage( data, root ); } else if ( page === 'PJs' ) { data = Object.assign( {}, data, { characters: data.characters.filter( function ( character ) { return character.isPlayer === true || character.isPlayer === 1; } ) } ); listPage( data, root ); } else if ( page === 'Factions' ) { factionsPage( data, root ); } else if ( page.indexOf( 'Personnage:' ) === 0 ) { var character = data.characters.filter( function ( item ) { return item.wikiPageTitle === page; } )[0]; if ( character ) { characterPage( data, root, character ); } } else { var faction = data.factions.filter( function ( item ) { return item.wikiPageTitle === page; } )[0]; if ( faction ) { factionPage( data, root, faction ); } } } ); } );
}() );
