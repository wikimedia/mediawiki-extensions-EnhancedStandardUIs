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
	this.loading = false;
	this.rows = [];
	this.removeTargets = [];
	this.query = '';
	this.sections = [];

	this.$body = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-body' );
	this.$toolbar = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-toolbar' );
	this.$list = $( '<div>' ).addClass( 'enhanced-ui-watchlist-tab-list' );
	this.$noResults = $( '<div>' )
		.addClass( 'enhanced-ui-watchlist-no-results hidden' )
		.text( mw.message( 'enhanced-standard-uis-watchlist-no-results' ).text() );
	this.$body.append( this.$toolbar, this.$list, this.$noResults );
	this.$element.append( this.$body );
};

OO.inheritClass( ext.enhancedUI.widget.WatchlistTab, OO.ui.TabPanelLayout );

/**
 * Build a tab label that combines an icon and text.
 *
 * The icon is drawn from a bundled SVG via a CSS mask (see
 * `ext.enhancedUI.special.watchlist.css`), so no icon webfont has to be present in the
 * wiki. `icon` is the bare glyph name the provider returns; it selects the modifier
 * class `enhanced-ui-watchlist-tab-icon--<name>`.
 *
 * @param {string} icon Glyph name, e.g. "file-earmark"
 * @param {string} title
 * @return {jQuery}
 */
ext.enhancedUI.widget.WatchlistTab.buildTabLabel = function ( icon, title ) {
	const $label = $( '<span>' ).addClass( 'enhanced-ui-watchlist-tab-label' );
	if ( icon ) {
		// The following classes are used here:
		// * enhanced-ui-watchlist-tab-icon--file-earmark
		// * enhanced-ui-watchlist-tab-icon--tag
		// * enhanced-ui-watchlist-tab-icon--book
		// * enhanced-ui-watchlist-tab-icon--namespaces
		$label.append(
			$( '<span>' )
				.addClass(
					'enhanced-ui-watchlist-tab-icon enhanced-ui-watchlist-tab-icon--' + icon
				)
				.attr( 'aria-hidden', 'true' )
		);
	}
	$label.append( $( '<span>' ).text( title ) );
	return $label;
};

/**
 * Resolve a per-tab message. Each watched-item type carries its own fully written
 * message (`<base>-<key>`, e.g. `<base>-clear-all-pages`) so translations do not have
 * to splice a lower-cased tab name into a sentence, which only reads correctly in
 * English. Falls back to the generic `<base>` message (with the untouched tab title as
 * `$1`) for provider types contributed by other extensions that ship no dedicated one.
 *
 * @param {string} base Message key without the type suffix
 * @return {mw.Message}
 */
ext.enhancedUI.widget.WatchlistTab.prototype.getTypeMessage = function ( base ) {
	const specific = base + '-' + this.provider.getKey();
	// eslint-disable-next-line mediawiki/msg-doc
	if ( mw.message( specific ).exists() ) {
		// eslint-disable-next-line mediawiki/msg-doc
		return mw.message( specific );
	}
	// eslint-disable-next-line mediawiki/msg-doc
	return mw.message( base, this.provider.getTabTitle() );
};

ext.enhancedUI.widget.WatchlistTab.prototype.ensureLoaded = function () {
	if ( this.loaded || this.loading ) {
		return;
	}
	this.loading = true;
	this.rows = [];
	this.removeTargets = [];
	this.$toolbar.empty();
	this.$noResults.addClass( 'hidden' );
	this.$list.empty().addClass( 'oo-ui-pendingElement-pending' );
	this.provider.getItems().done( ( response ) => {
		this.loading = false;
		this.loaded = true;
		this.$list.removeClass( 'oo-ui-pendingElement-pending' );
		this.render( ( response && response.sections ) || [] );
	} ).fail( () => {
		this.loading = false;
		this.loaded = false;
		this.$list.removeClass( 'oo-ui-pendingElement-pending' );
		this.renderError();
	} );
};

ext.enhancedUI.widget.WatchlistTab.prototype.render = function ( sections ) {
	this.rows = [];
	this.sections = [];
	this.removeTargets = [];
	this.$toolbar.empty();
	this.$list.empty();

	if ( !sections.length ) {
		this.renderEmpty();
		return;
	}

	this.clearButton = new OO.ui.ButtonWidget( {
		label: this.getTypeMessage( 'enhanced-standard-uis-watchlist-clear-all' ).text(),
		framed: false,
		flags: [ 'destructive' ],
		classes: [ 'enhanced-ui-watchlist-clear-all' ]
	} );
	this.clearButton.connect( this, { click: 'onClearAll' } );
	this.$toolbar.append( this.clearButton.$element );

	sections.forEach( ( section ) => {
		this.$list.append( this.renderSection( section ) );
	} );

	this.applyFilter();
};

ext.enhancedUI.widget.WatchlistTab.prototype.renderSection = function ( section ) {
	const $section = $( '<section>' ).addClass( 'enhanced-ui-watchlist-section' );
	const $list = $( '<ul>' )
		.addClass( 'enhanced-ui-watchlist-list' )
		.attr( 'id', OO.ui.generateElementId() );
	const record = { $section: $section, $list: $list, expander: null, collapsible: false, expanded: true };
	const items = section.items || [];

	if ( section.section ) {
		const $heading = $( '<h2>' ).addClass( 'enhanced-ui-watchlist-section-heading' );
		if ( section.collapsible ) {
			record.collapsible = true;
			record.expanded = false;
			$section.addClass( 'enhanced-ui-watchlist-section-collapsible collapsed' );
			record.expander = this.makeExpander( record );
			$heading
				.addClass( 'enhanced-ui-watchlist-section-heading--toggle' )
				.append( record.expander.$element );
			$heading.on( 'click', ( e ) => {
				// The expander button and the remove button handle their own clicks.
				if ( $( e.target ).closest(
					'.enhanced-ui-watchlist-expander, .enhanced-ui-watchlist-remove'
				).length ) {
					return;
				}
				this.toggleSection( record );
			} );
		}
		$heading.append(
			$( '<span>' ).addClass( 'enhanced-ui-watchlist-section-title' ).text( section.section )
		);
		if ( section.target ) {
			this.removeTargets.push( section.target );
			$heading.append( this.makeRemoveButton( section.target, $section, true ) );
		}
		$section.append( $heading );
	}

	items.forEach( ( item ) => {
		$list.append( this.renderRow( item, $section ) );
	} );
	$section.append( $list );

	this.sections.push( record );
	return $section;
};

ext.enhancedUI.widget.WatchlistTab.prototype.makeExpander = function ( record ) {
	const expandLabel = mw.message( 'enhanced-standard-uis-watchlist-section-expand-label' ).text();
	const expander = new OO.ui.ButtonWidget( {
		icon: 'expand',
		framed: false,
		label: expandLabel,
		invisibleLabel: true,
		title: expandLabel,
		classes: [ 'enhanced-ui-watchlist-expander' ]
	} );
	expander.$button
		.attr( 'aria-expanded', 'false' )
		.attr( 'aria-controls', record.$list.attr( 'id' ) );
	expander.connect( this, { click: [ 'toggleSection', record ] } );
	return expander;
};

/**
 * Expand or collapse a namespace section. Pass `force` to set an explicit state.
 *
 * @param {Object} record entry of this.sections
 * @param {boolean} [force] true to expand, false to collapse
 */
ext.enhancedUI.widget.WatchlistTab.prototype.toggleSection = function ( record, force ) {
	if ( !record.collapsible ) {
		return;
	}
	const expanded = force === undefined ? !record.expanded : force;
	if ( expanded === record.expanded ) {
		return;
	}
	record.expanded = expanded;
	record.$section.toggleClass( 'collapsed', !expanded );
	if ( record.expander ) {
		const label = expanded ?
			mw.message( 'enhanced-standard-uis-watchlist-section-collapse-label' ).text() :
			mw.message( 'enhanced-standard-uis-watchlist-section-expand-label' ).text();
		record.expander.setLabel( label );
		record.expander.setTitle( label );
		record.expander.$button.attr( 'aria-expanded', expanded ? 'true' : 'false' );
	}
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
		this.getTypeMessage( 'enhanced-standard-uis-watchlist-clear-confirm' ).text(),
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
	this.rows = [];
	this.sections = [];
	this.$toolbar.empty();
	this.$noResults.addClass( 'hidden' );
	this.$list.empty().append(
		$( '<div>' )
			.addClass( 'enhanced-ui-watchlist-empty' )
			.text( mw.message( 'enhanced-standard-uis-watchlist-empty' ).text() )
	);
};

/**
 * Shown when the items could not be loaded. This must be distinguishable from an empty
 * tab: rendering the "no watched items" placeholder on a failed request makes a failure
 * look like an emptied watchlist, and leaves no way to retry other than reloading.
 */
ext.enhancedUI.widget.WatchlistTab.prototype.renderError = function () {
	this.$toolbar.empty();
	this.$noResults.addClass( 'hidden' );

	const retryButton = new OO.ui.ButtonWidget( {
		label: mw.message( 'enhanced-standard-uis-watchlist-retry' ).text(),
		framed: false,
		flags: [ 'progressive' ]
	} );
	retryButton.connect( this, { click: 'ensureLoaded' } );

	this.$list.empty().append(
		$( '<div>' )
			.addClass( 'enhanced-ui-watchlist-error' )
			.text( mw.message( 'enhanced-standard-uis-watchlist-load-error' ).text() )
			.append( retryButton.$element )
	);
};

/**
 * Set the search query for this tab. The query is remembered, so that it is re-applied
 * whenever the rows are (re-)rendered - most notably when a tab is loaded lazily after
 * the user has already typed something.
 *
 * @param {string} query
 */
ext.enhancedUI.widget.WatchlistTab.prototype.filter = function ( query ) {
	this.query = query || '';
	this.applyFilter();
};

/**
 * Apply the remembered query to the currently rendered rows (case-insensitive substring
 * on the label) and toggle the "no matching results" hint. Collapsible sections are
 * expanded while a query is active, so matches are not hidden inside a collapsed
 * section, and collapse again once the query is cleared.
 */
ext.enhancedUI.widget.WatchlistTab.prototype.applyFilter = function () {
	const needle = this.query.toLowerCase();
	let matches = 0;
	this.rows.forEach( ( row ) => {
		const match = row.label.toLowerCase().includes( needle );
		row.$row.toggleClass( 'hidden', !match );
		if ( match ) {
			matches++;
		}
	} );
	this.sections.forEach( ( record ) => {
		const hasVisible = record.$list.find( '.enhanced-ui-watchlist-item:not(.hidden)' ).length > 0;
		record.$section.toggleClass( 'hidden', !hasVisible );
		if ( record.collapsible ) {
			this.toggleSection( record, needle !== '' && hasVisible );
		}
	} );

	this.$noResults.toggleClass( 'hidden', !( needle !== '' && this.rows.length > 0 && matches === 0 ) );
};
