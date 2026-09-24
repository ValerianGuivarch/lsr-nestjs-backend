( function () {
	'use strict';
	function currentPage() { return mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ); }
	function errorMessage( error ) { return ( error && error.error && ( error.error.info || error.error.code ) ) || 'Mise à jour impossible.'; }
	function update( op, number, payload ) { return new mw.Api().postWithToken( 'csrf', { action: 'pf2journalsupdate', format: 'json', op: op, number: number, payload: JSON.stringify( payload ) } ); }
	function edit( item, redraw ) {
		var title = window.prompt( 'Titre du journal', item.title ); if ( title === null ) { return; }
		var content = window.prompt( 'Texte du journal (Markdown accepté)', item.content ); if ( content === null ) { return; }
		var rawDependencies = window.prompt( 'Dépendances (numéros séparés par des virgules)', item.dependencies.join( ', ' ) ); if ( rawDependencies === null ) { return; }
		var dependencies = rawDependencies.split( ',' ).map( function ( value ) { return Number( value.trim() ); } ).filter( function ( value ) { return Number.isInteger( value ) && value > 0; } );
		update( 'save', item.number, { title: title, content: content, dependencies: dependencies } ).then( redraw ).catch( function ( error ) { mw.notify( errorMessage( error ), { type: 'error' } ); } );
	}
	function editor( items ) {
		var host = document.querySelector( '#pf2-journals' ); if ( !host ) { return; }
		var panel = document.createElement( 'section' ); panel.className = 'pf2-journal-editor'; var heading = document.createElement( 'h2' ); heading.textContent = 'Administration des journaux'; panel.appendChild( heading );
		var note = document.createElement( 'p' ); note.textContent = 'Le catalogue est stocké dans SQLite. Les modifications ici demandent un droit administrateur et un token CSRF.'; panel.appendChild( note );
		var redraw = function () { window.location.reload(); };
		var add = document.createElement( 'button' ); add.textContent = 'Ajouter un journal'; add.onclick = function () { var number = Number( window.prompt( 'Numéro unique du journal' ) ); if ( !Number.isInteger( number ) || number < 1 ) { return; } edit( { number: number, title: '', content: '', dependencies: [] }, redraw ); }; panel.appendChild( add );
		items.forEach( function ( item ) { var row = document.createElement( 'div' ); row.className = 'pf2-journal-editor-row'; var label = document.createElement( 'strong' ); label.textContent = item.number + ' - ' + item.title; row.appendChild( label ); var editButton = document.createElement( 'button' ); editButton.textContent = 'Modifier'; editButton.onclick = function () { edit( item, redraw ); }; row.appendChild( editButton ); var remove = document.createElement( 'button' ); remove.textContent = 'Supprimer'; remove.onclick = function () { if ( window.confirm( 'Supprimer ce journal non révélé ?' ) ) { update( 'delete', item.number, {} ).then( redraw ).catch( function ( error ) { mw.notify( errorMessage( error ), { type: 'error' } ); } ); } }; row.appendChild( remove ); panel.appendChild( row ); } );
		host.parentNode.insertBefore( panel, host.nextSibling );
	}
	$( function () { if ( currentPage() !== 'Journaux' ) { return; } new mw.Api().get( { action: 'pf2journals', format: 'json', admin: 1 } ).then( function ( response ) { if ( response.pf2journals && response.pf2journals.canAdmin ) { editor( response.pf2journals.data ); } } ); } );
}() );
