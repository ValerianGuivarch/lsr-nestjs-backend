( function () {
	'use strict';

	function page() { return mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ); }
	function number( value ) { var found = /^Journal-(\d+)$/.exec( value ); return found ? Number( found[ 1 ] ) : null; }
	function link( title, text ) { var node = document.createElement( 'a' ); node.href = mw.util.getUrl( title ); node.textContent = text; return node; }
	function root() { var content = document.querySelector( '#mw-content-text' ); if ( !content ) { return null; } var node = document.createElement( 'section' ); node.id = 'pf2-journals'; content.textContent = ''; content.appendChild( node ); return node; }
	function heading( value ) { var node = document.querySelector( '.mw-page-title-main, #firstHeading' ); if ( node ) { node.textContent = value; } }
	function locked( item, admin ) {
		var row = document.createElement( 'article' ); row.className = 'pf2-journal-card pf2-journal-locked'; var text = item.number + ' - ' + item.title;
		if ( admin ) { row.appendChild( link( 'Journal-' + item.number, '🔒 ' + text ) ); var note = document.createElement( 'small' ); note.textContent = 'Non disponible pour le moment'; row.appendChild( note ); } else { row.textContent = '🔒 ' + text; }
		return row;
	}
	function normalized( value ) { return value.toLocaleLowerCase(); }
	function list( payload, node ) {
		heading( 'Journaux' );
		var revealedCount = payload.data.filter( function ( item ) { return item.revealed; } ).length;
		var h = document.createElement( 'h2' ); h.textContent = 'Journaux : ' + revealedCount + ' sur ' + payload.data.length; node.appendChild( h );
		var search = document.createElement( 'input' ); search.type = 'search'; search.className = 'pf2-journal-search'; search.placeholder = 'Rechercher un journal'; search.setAttribute( 'aria-label', 'Rechercher un journal par titre' ); node.appendChild( search );
		var grid = document.createElement( 'div' ); grid.className = 'pf2-journal-grid'; node.appendChild( grid );
		function render() {
			var term = normalized( search.value.trim() ); grid.textContent = '';
			payload.data.filter( function ( item ) { return !term || normalized( item.title ).indexOf( term ) !== -1; } ).forEach( function ( item ) {
				if ( item.revealed ) { var row = document.createElement( 'article' ); row.className = 'pf2-journal-card pf2-journal-revealed'; row.appendChild( link( 'Journal-' + item.number, item.number + ' - ' + item.title ) ); grid.appendChild( row ); } else { grid.appendChild( locked( item, payload.canAdmin ) ); }
			} );
		}
		search.addEventListener( 'input', render ); render();
	}
	function detail( payload, node ) {
		var item = payload.data; heading( 'Journal ' + item.number + ' — ' + item.title ); var h = document.createElement( 'h2' ); h.textContent = item.number + ' - ' + item.title; node.appendChild( h );
		if ( !item.revealed ) { if ( !payload.canAdmin || typeof item.content !== 'string' ) { var hidden = document.createElement( 'p' ); hidden.className = 'pf2-journal-hidden'; hidden.textContent = 'Journal non révélé'; node.appendChild( hidden ); return; } var notice = document.createElement( 'p' ); notice.className = 'pf2-journal-admin-notice'; notice.textContent = 'Journal non révélé'; node.appendChild( notice ); }
		var content = document.createElement( 'div' ); content.className = 'pf2-journal-content'; content.textContent = item.content || ''; node.appendChild( content );
	}
	$( function () {
		var current = page(); var journal = number( current ); if ( current !== 'Journaux' && journal === null ) { return; } var node = root(); if ( !node ) { return; }
		new mw.Api().get( { action: 'pf2journals', format: 'json', number: journal || undefined } ).then( function ( response ) {
			if ( current === 'Journaux' ) { list( response.pf2journals, node ); return; }
			var payload = response.pf2journals;
			if ( payload && payload.canAdmin && payload.data && !payload.data.revealed && typeof payload.data.content !== 'string' ) {
				return new mw.Api().get( { action: 'pf2journals', format: 'json', admin: 1 } ).then( function ( adminResponse ) {
					var adminPayload = adminResponse.pf2journals;
					var item = adminPayload && Array.isArray( adminPayload.data ) ? adminPayload.data.find( function ( candidate ) { return candidate.number === journal; } ) : null;
					if ( item ) { detail( { data: Object.assign( {}, item, { revealed: 0 } ), canAdmin: 1 }, node ); } else { detail( payload, node ); }
				} );
			}
			detail( payload, node );
		} ).catch( function () { node.textContent = 'Impossible de charger les journaux.'; } );
	} );
}() );
