ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.widget = ext.enhancedUI.widget || {};

/**
 * A single tab of the enhanced watchlist page. Renders the items of one provider,
 * grouped into sections, with an eye icon per row that unwatches the item.
 *
 * @param {Object} cfg provider: ext.enhancedUI.watchlist.provider.WatchlistItemProvider
 */
ext.enhancedUI.widget.WatchlistTab = function ( cfg ) {
	this.provider = cfg.provider;
	ext.enhancedUI.widget.WatchlistTab.super.call( this, this.provider.getKey(), {
		expanded: false,
		label: ext.enhancedUI.widget.WatchlistTab.buildTabLabel(
			this.provider.getTabIcon(), this.provider.getTabTitle()
		)
	} );

	this.loaded = false;
	this.rows = [];

	this.$body = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-body' );
	this.$toolbar = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-toolbar' );
	this.$list = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-list' );
	this.$body.append( this.$toolbar, this.$list );
	this.$element.append( this.$body );
};

OO.inheritClass( ext.enhancedUI.widget.WatchlistTab, OO.ui.TabPanelLayout );

/**
 * Build a tab label that combines an icon and text.
 *
 * @param {string} icon OOUI icon name
 * @param {string} title
 * @return {jQuery}
 */
ext.enhancedUI.widget.WatchlistTab.buildTabLabel = function ( icon, title ) {
	const $label = $( '<span>' ).addClass( 'enhanced-ui-watchlist-tab-label' );
	if ( icon ) {
		$label.append( new OO.ui.IconWidget( { icon: icon } ).$element );
	}
	$label.append( $( '<span>' ).text( title ) );
	return $label;
};

ext.enhancedUI.widget.WatchlistTab.prototype.ensureLoaded = function () {
	if ( this.loaded ) {
		return;
	}
	this.loaded = true;
	this.$list.empty().addClass( 'oo-ui-pendingElement-pending' );
	this.provider.getItems().done( ( response ) => {
		this.$list.removeClass( 'oo-ui-pendingElement-pending' );
		this.render( ( response && response.sections ) || [] );
	} ).fail( () => {
		this.$list.removeClass( 'oo-ui-pendingElement-pending' );
		this.loaded = false;
		this.renderEmpty();
	} );
};

ext.enhancedUI.widget.WatchlistTab.prototype.render = function ( sections ) {
	this.rows = [];
	this.removeTargets = [];
	this.$toolbar.empty();
	this.$list.empty();

	if ( !sections.length ) {
		this.renderEmpty();
		return;
	}

	this.clearButton = new OO.ui.ButtonWidget( {
		label: mw.message(
			'enhanced-standard-uis-watchlist-clear-all',
			this.provider.getTabTitle()
		).text(),
		framed: false,
		flags: [ 'destructive' ],
		classes: [ 'enhanced-ui-watchlist-clear-all' ]
	} );
	this.clearButton.connect( this, { click: 'onClearAll' } );
	this.$toolbar.append( this.clearButton.$element );

	sections.forEach( ( section ) => {
		this.$list.append( this.renderSection( section ) );
	} );
};

ext.enhancedUI.widget.WatchlistTab.prototype.renderSection = function ( section ) {
	const $section = $( '<section>' ).addClass( 'enhanced-ui-watchlist-section' );
	if ( section.section ) {
		const $heading = $( '<h2>' ).text( section.section );
		if ( section.target ) {
			this.removeTargets.push( section.target );
			$heading.append( this.makeRemoveButton( section.target, $section, true ) );
		}
		$section.append( $heading );
	}
	const $list = $( '<ul>' ).addClass( 'enhanced-ui-watchlist-list' );
	( section.items || [] ).forEach( ( item ) => {
		$list.append( this.renderRow( item, $section ) );
	} );
	$section.append( $list );
	return $section;
};

ext.enhancedUI.widget.WatchlistTab.prototype.renderRow = function ( item, $section ) {
	const $row = $( '<li>' ).addClass( 'enhanced-ui-watchlist-item' );
	const $link = $( '<a>' )
		.attr( 'href', item.url )
		.text( item.label );
	if ( !item.exists ) {
		$link.addClass( 'new' );
	}
	$row.append( $link );

	if ( item.prefixedText ) {
		this.removeTargets.push( item.prefixedText );
		$row.append( this.makeRemoveButton( item.prefixedText, $row, false ) );
	}

	this.rows.push( { label: item.label, $row: $row, $section: $section } );
	return $row;
};

ext.enhancedUI.widget.WatchlistTab.prototype.makeRemoveButton = function ( target, $element, isSection ) {
	const button = new OO.ui.ButtonWidget( {
		icon: 'eye',
		framed: false,
		title: mw.message( 'enhanced-standard-uis-watchlist-remove-tooltip' ).text(),
		classes: [ 'enhanced-ui-watchlist-remove' ]
	} );
	button.connect( this, { click: [ 'onRemove', target, $element, isSection ] } );
	return button.$element;
};

ext.enhancedUI.widget.WatchlistTab.prototype.onRemove = function ( target, $element, isSection ) {
	this.provider.removeCallback( target ).done( () => {
		this.removeTargets = this.removeTargets.filter( ( t ) => t !== target );
		if ( isSection ) {
			this.rows = this.rows.filter( ( r ) => r.$section[ 0 ] !== $element[ 0 ] );
			$element.remove();
		} else {
			const $section = $element.closest( '.enhanced-ui-watchlist-section' );
			this.rows = this.rows.filter( ( r ) => r.$row !== $element );
			$element.remove();
			if ( !$section.find( '.enhanced-ui-watchlist-item' ).length ) {
				$section.remove();
			}
		}
		if ( !this.$list.find( '.enhanced-ui-watchlist-section' ).length ) {
			this.render( [] );
		}
	} ).fail( () => {
		mw.notify(
			mw.message( 'enhanced-standard-uis-watchlist-remove-tooltip' ).text(),
			{ type: 'error' }
		);
	} );
};

ext.enhancedUI.widget.WatchlistTab.prototype.onClearAll = function () {
	OO.ui.confirm(
		mw.message(
			'enhanced-standard-uis-watchlist-clear-confirm',
			this.provider.getTabTitle()
		).text(),
		{
			actions: [
				{
					action: 'reject',
					label: mw.message( 'cancel' ).text(),
					flags: 'safe'
				},
				{
					action: 'accept',
					label: mw.message( 'enhanced-standard-uis-watchlist-clear-confirm-action' ).text(),
					flags: [ 'primary', 'destructive' ]
				}
			]
		}
	).done( ( confirmed ) => {
		if ( !confirmed ) {
			return;
		}
		const targets = this.removeTargets.slice();
		if ( !targets.length ) {
			return;
		}
		this.provider.removeCallback( targets ).done( () => {
			this.render( [] );
		} );
	} );
};

ext.enhancedUI.widget.WatchlistTab.prototype.renderEmpty = function () {
	this.$toolbar.empty();
	this.$list.empty().append(
		$( '<div>' )
			.addClass( 'enhanced-ui-watchlist-empty' )
			.text( mw.message( 'enhanced-standard-uis-watchlist-empty' ).text() )
	);
};

/**
 * Filter visible rows by a search query (case-insensitive substring on the label).
 *
 * @param {string} query
 */
ext.enhancedUI.widget.WatchlistTab.prototype.filter = function ( query ) {
	const needle = ( query || '' ).toLowerCase();
	const visibleSections = {};
	this.rows.forEach( ( row ) => {
		const match = row.label.toLowerCase().indexOf( needle ) !== -1;
		row.$row.toggleClass( 'hidden', !match );
		if ( match ) {
			visibleSections[ row.$section.index() ] = row.$section;
		}
	} );
	this.$list.find( '.enhanced-ui-watchlist-section' ).each( function () {
		const hasVisible = $( this ).find( '.enhanced-ui-watchlist-item:not(.hidden)' ).length > 0;
		$( this ).toggleClass( 'hidden', !hasVisible );
	} );
};
