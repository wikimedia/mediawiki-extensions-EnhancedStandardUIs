ext = ext || {};
ext.enhancedUI = ext.enhancedUI || {};
ext.enhancedUI.panel = ext.enhancedUI.panel || {};

const providerDescriptors = require( '../config/providers.json' );

require( '../widget/provider/WatchlistItemProvider.js' );
require( '../widget/WatchlistTab.js' );

/**
 * Top-level panel of the enhanced Special:EditWatchlist page: a search box plus an
 * IndexLayout with one tab per registered provider (pages, categories, namespaces, …).
 *
 * @param {Object} cfg providers: array of server-side provider descriptors
 */
ext.enhancedUI.panel.WatchlistPanel = function ( cfg ) {
	ext.enhancedUI.panel.WatchlistPanel.super.apply( this, [ { expanded: false } ] );
	this.$element.addClass( 'enhanced-ui-watchlist-panel' );

	this.providerDescriptors = cfg.providers || [];
	this.tabs = [];

	// eslint-disable-next-line no-jquery/no-global-selector
	this.searchWidget = OO.ui.infuse( $( '#enhanced-ui-watchlist-filter' ) );
	this.searchWidget.connect( this, { change: 'onFilter' } );

	this.indexLayout = new OO.ui.IndexLayout( {
		expanded: false,
		framed: false
	} );
	this.indexLayout.connect( this, { set: 'onTabSet' } );

	this.setupTabs();
	this.$element.append( this.indexLayout.$element );
};

OO.inheritClass( ext.enhancedUI.panel.WatchlistPanel, OO.ui.PanelLayout );

ext.enhancedUI.panel.WatchlistPanel.prototype.setupTabs = function () {
	const tabPanels = [];

	this.providerDescriptors.forEach( ( descriptor ) => {
		const ProviderClass = this.resolveProviderClass( descriptor.providerClass );
		const provider = new ProviderClass( {
			key: descriptor.key,
			title: descriptor.title,
			icon: descriptor.icon
		} );
		const tab = new ext.enhancedUI.widget.WatchlistTab( { provider: provider } );
		this.tabs.push( tab );
		tabPanels.push( tab );
	} );

	this.indexLayout.addTabPanels( tabPanels );

	if ( this.tabs.length ) {
		this.tabs[ 0 ].ensureLoaded();
	}
};

/**
 * @param {string|null} name Dotted global path, e.g. "ext.enhancedUI.watchlist.provider.Page"
 * @return {Function} The provider constructor, or the base provider as fallback
 */
ext.enhancedUI.panel.WatchlistPanel.prototype.resolveProviderClass = function ( name ) {
	const base = ext.enhancedUI.watchlist.provider.WatchlistItemProvider;
	if ( !name ) {
		return base;
	}
	let resolved = window;
	const parts = name.split( '.' );
	for ( let i = 0; i < parts.length; i++ ) {
		if ( resolved === undefined || resolved === null ) {
			return base;
		}
		resolved = resolved[ parts[ i ] ];
	}
	return typeof resolved === 'function' ? resolved : base;
};

ext.enhancedUI.panel.WatchlistPanel.prototype.onTabSet = function ( tabPanel ) {
	if ( tabPanel && typeof tabPanel.ensureLoaded === 'function' ) {
		tabPanel.ensureLoaded();
	}
	this.onFilter( this.searchWidget.getValue() );
};

ext.enhancedUI.panel.WatchlistPanel.prototype.onFilter = function ( value ) {
	const current = this.indexLayout.getCurrentTabPanel();
	if ( current && typeof current.filter === 'function' ) {
		current.filter( value );
	}
};

$( () => {
	// eslint-disable-next-line no-jquery/no-global-selector
	const $panelCnt = $( '#enhanced-ui-watchlist-panel' );
	const panel = new ext.enhancedUI.panel.WatchlistPanel( {
		providers: providerDescriptors || []
	} );
	$panelCnt.append( panel.$element );
} );
